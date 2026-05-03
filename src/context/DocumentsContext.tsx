import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { appLogger } from "../lib/logger";
import { platformService } from "../lib/services";
import { useAuth } from "./AuthContext";
import { useImpersonation } from "./ImpersonationContext";
import type {
  DocumentDetail,
  DocumentRecord,
  ExtractedData,
  OutputFormat,
  ProcessingStage,
  Profile,
  WorkflowType,
} from "../types";

interface DocumentsContextValue {
  documents: DocumentRecord[];
  loading: boolean;
  stage: ProcessingStage;
  processingError?: string;
  selectedDetail?: DocumentDetail;
  refreshDocuments: () => Promise<void>;
  uploadAndProcess: (params: {
    file: File;
    workflowType: WorkflowType;
    outputFormat: OutputFormat;
  }) => Promise<DocumentDetail | undefined>;
  getDocumentDetail: (documentId: string) => Promise<DocumentDetail | undefined>;
  updateExtractedData: (extractedDataId: string, updates: Partial<ExtractedData>) => Promise<void>;
  deleteDocument: (documentId: string) => Promise<void>;
}

const DocumentsContext = createContext<DocumentsContextValue | undefined>(undefined);

const resolveActiveProfile = (profile: Profile | null, impersonated: Profile | null) => impersonated || profile;

export const DocumentsProvider = ({ children }: { children: ReactNode }) => {
  const { profile } = useAuth();
  const { targetProfile } = useImpersonation();
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [selectedDetail, setSelectedDetail] = useState<DocumentDetail>();
  const [loading, setLoading] = useState(true);
  const [stage, setStage] = useState<ProcessingStage>("idle");
  const [processingError, setProcessingError] = useState("");

  const refreshDocuments = useCallback(async () => {
    const activeProfile = resolveActiveProfile(profile, targetProfile);
    if (!activeProfile) {
      appLogger.warn("DocumentsContext", "refreshDocuments skipped because there is no active profile.");
      setDocuments([]);
      setLoading(false);
      return;
    }

    appLogger.info("DocumentsContext", "Refreshing documents.", {
      userId: activeProfile.userId,
      role: activeProfile.role,
      impersonating: Boolean(targetProfile),
    });
    setLoading(true);
    try {
      const nextDocuments = await platformService.listDocuments(activeProfile);
      setDocuments(nextDocuments);
      appLogger.info("DocumentsContext", "Documents refreshed.", {
        count: nextDocuments.length,
      });
    } finally {
      setLoading(false);
    }
  }, [profile, targetProfile]);

  useEffect(() => {
    void refreshDocuments();
  }, [refreshDocuments]);

  const uploadAndProcess = useCallback(
    async ({
      file,
      workflowType,
      outputFormat,
    }: {
      file: File;
      workflowType: WorkflowType;
      outputFormat: OutputFormat;
    }) => {
      const activeProfile = resolveActiveProfile(profile, targetProfile);
      if (!activeProfile) {
        appLogger.warn("DocumentsContext", "uploadAndProcess aborted because there is no active profile.");
        return undefined;
      }

      appLogger.info("DocumentsContext", "Starting upload and processing flow.", {
        fileName: file.name,
        fileSize: file.size,
        workflowType,
        outputFormat,
        userId: activeProfile.userId,
      });
      setProcessingError("");
      setStage("uploading");
      try {
        const document = await platformService.createDocument({
          profile: activeProfile,
          file,
          workflowType,
          outputFormat,
        });
        await refreshDocuments();

        setStage("processing");
        setStage("extracting");
        setStage("generating");
        const result = await platformService.processDocument({
          documentId: document.id,
          workflowType,
          outputFormat,
          profile: activeProfile,
        });

        setStage(result.stage);
        await refreshDocuments();
        const detail = await platformService.getDocumentDetail(document.id);
        setSelectedDetail(detail);
        appLogger.info("DocumentsContext", "Upload and processing flow completed.", {
          documentId: document.id,
          finalStage: result.stage,
          hasDetail: Boolean(detail),
        });
        return detail;
      } catch (error) {
        setStage("failed");
        setProcessingError(error instanceof Error ? error.message : "Document processing failed.");
        appLogger.error("DocumentsContext", "Upload and processing flow failed.", {
          fileName: file.name,
          workflowType,
          outputFormat,
          error: error instanceof Error ? error.message : "unknown",
        });
        await refreshDocuments();
        return undefined;
      }
    },
    [profile, refreshDocuments, targetProfile],
  );

  const getDocumentDetail = useCallback(async (documentId: string) => {
    appLogger.info("DocumentsContext", "Loading document detail.", { documentId });
    const detail = await platformService.getDocumentDetail(documentId);
    setSelectedDetail(detail);
    appLogger.info("DocumentsContext", "Document detail loaded.", {
      documentId,
      hasDetail: Boolean(detail),
      hasExtractedData: Boolean(detail?.extractedData),
    });
    return detail;
  }, []);

  const updateExtractedData = useCallback(async (extractedDataId: string, updates: Partial<ExtractedData>) => {
    appLogger.info("DocumentsContext", "Updating extracted data from context.", {
      extractedDataId,
      updatedKeys: Object.keys(updates),
    });
    await platformService.updateExtractedData(extractedDataId, updates);
  }, []);

  const deleteDocument = useCallback(
    async (documentId: string) => {
      appLogger.info("DocumentsContext", "Deleting document from context.", { documentId });
      await platformService.deleteDocument(documentId);
      await refreshDocuments();
    },
    [refreshDocuments],
  );

  const value = useMemo(
    () => ({
      documents,
      loading,
      stage,
      processingError,
      selectedDetail,
      refreshDocuments,
      uploadAndProcess,
      getDocumentDetail,
      updateExtractedData,
      deleteDocument,
    }),
    [deleteDocument, documents, getDocumentDetail, loading, processingError, refreshDocuments, selectedDetail, stage, updateExtractedData, uploadAndProcess],
  );

  return <DocumentsContext.Provider value={value}>{children}</DocumentsContext.Provider>;
};

export const useDocuments = () => {
  const context = useContext(DocumentsContext);
  if (!context) {
    throw new Error("useDocuments must be used within DocumentsProvider");
  }
  return context;
};
