import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
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

  const refreshDocuments = useCallback(async () => {
    const activeProfile = resolveActiveProfile(profile, targetProfile);
    if (!activeProfile) {
      setDocuments([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const nextDocuments = await platformService.listDocuments(activeProfile);
      setDocuments(nextDocuments);
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
        return undefined;
      }

      setStage("uploading");
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
      return detail;
    },
    [profile, refreshDocuments, targetProfile],
  );

  const getDocumentDetail = useCallback(async (documentId: string) => {
    const detail = await platformService.getDocumentDetail(documentId);
    setSelectedDetail(detail);
    return detail;
  }, []);

  const updateExtractedData = useCallback(async (extractedDataId: string, updates: Partial<ExtractedData>) => {
    await platformService.updateExtractedData(extractedDataId, updates);
  }, []);

  const deleteDocument = useCallback(
    async (documentId: string) => {
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
      selectedDetail,
      refreshDocuments,
      uploadAndProcess,
      getDocumentDetail,
      updateExtractedData,
      deleteDocument,
    }),
    [deleteDocument, documents, getDocumentDetail, loading, refreshDocuments, selectedDetail, stage, updateExtractedData, uploadAndProcess],
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
