"use client";

import React, { useState, useCallback, useEffect } from "react";
import ChatInterface from "./ChatInterface";
import DocumentViewer from "./DocumentViewer";
import ProcessingComponent from "./ProcessingComponent";
import UploadComponent from "./UploadComponent";
import RiskDashboard from "./RiskDashboard";
import Checklist from "./Checklist";
import apiService from "../services/api";

const APP_STATE = {
  AWAITING_UPLOAD: "AWAITING_UPLOAD",
  GENERAL_CHAT: "GENERAL_CHAT",
  PROCESSING: "PROCESSING",
  ANALYSIS: "ANALYSIS",
};

export default function ChatPage({ initialMode }) {
  const [appState, setAppState] = useState(
    initialMode === "upload" ? APP_STATE.AWAITING_UPLOAD : APP_STATE.GENERAL_CHAT
  );
  const [fileName, setFileName] = useState("");
  const [sanitizedDocText, setSanitizedDocText] = useState("");
  const [messages, setMessages] = useState([]);
  const [activeTab, setActiveTab] = useState('document'); 
  const [riskAnalysisResults, setRiskAnalysisResults] = useState(null);
  const [isAnalyzingRisks, setIsAnalyzingRisks] = useState(false);
  const [contractId, setContractId] = useState(null);
  const [processingStatus, setProcessingStatus] = useState(null);

  // --- New states for Checklist ---
  const [checklistData, setChecklistData] = useState(null);
  const [isGeneratingChecklist, setIsGeneratingChecklist] = useState(false);
  // ---

  const handleFileUpload = useCallback(async (file) => {
    if (!file) return;
    setAppState(APP_STATE.PROCESSING);
    setFileName(file.name);
    setRiskAnalysisResults(null);
    setChecklistData(null);
    setActiveTab('document');

    try {
      // Upload file to API
      const uploadResult = await apiService.uploadContract(file);
      setContractId(uploadResult.contract_id);
      
      // Poll for processing status
      const pollStatus = async () => {
        try {
          const status = await apiService.getContractStatus(uploadResult.contract_id);
          setProcessingStatus(status);
          
          if (status.status === 'completed') {
            const contractData = await apiService.getContract(uploadResult.contract_id);
            setSanitizedDocText(contractData.contract?.text || 'Document processed successfully');
            setMessages((prev) => [
              ...prev,
              {
                sender: "ai",
                text: `Great! Your document "${file.name}" has been processed. You can now ask questions, run a risk analysis, or generate a checklist.`,
                timestamp: new Date().toISOString(),
              },
            ]);
            setAppState(APP_STATE.ANALYSIS);
          } else if (status.status === 'failed') {
            throw new Error('Processing failed');
          } else {
            setTimeout(pollStatus, 2000);
          }
        } catch (error) {
          console.error('Status check failed:', error);
          setTimeout(pollStatus, 2000);
        }
      };
      
      pollStatus();
    } catch (error) {
      console.error('Upload failed:', error);
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: `Sorry, there was an error processing your document. Please try again.`,
          timestamp: new Date().toISOString(),
        },
      ]);
      setAppState(APP_STATE.GENERAL_CHAT);
    }
  }, []);

  const handleRiskAnalysis = useCallback(async () => {
    setActiveTab('risks');
    if (riskAnalysisResults) return;
    if (!contractId) {
      console.error('No contract ID available for risk analysis');
      return;
    }
    
    setIsAnalyzingRisks(true);
    try {
      const response = await apiService.getRiskAnalysis(contractId);
      const risks = response.risks || [];
      
      // Transform backend risk format to frontend format
      const transformedRisks = risks.map(risk => ({
        title: risk.description || `${risk.risk_type} Risk`,
        severity: risk.severity || 'medium',
        explanation: risk.description || 'Risk detected in contract',
        quote: risk.clause_text || 'No specific clause text available'
      }));
      
      setRiskAnalysisResults(transformedRisks);
    } catch (error) {
      console.error('Risk analysis failed:', error);
      // Fallback to show error message
      setRiskAnalysisResults([{
        title: 'Analysis Error',
        severity: 'low',
        explanation: 'Unable to complete risk analysis. Please try again.',
        quote: 'Error occurred during analysis'
      }]);
    }
    setIsAnalyzingRisks(false);
  }, [contractId, riskAnalysisResults]);

  // --- New function to handle checklist generation ---
  const handleGenerateChecklist = useCallback(async () => {
    setActiveTab('checklist');
    if (checklistData) return;
    setIsGeneratingChecklist(true);

    // In a real app, this would be a two-step AI call: 1. Classify doc, 2. Generate list
    await new Promise(resolve => setTimeout(resolve, 2000));

    const mockChecklist = {
        documentType: "Residential Lease Agreement",
        items: [
            "Copy of Tenant's Government-Issued ID (e.g., Aadhaar, Passport)",
            "Proof of Income (e.g., recent salary slips, bank statements)",
            "References from previous landlords",
            "Signed copy of the rental application form",
            "Security deposit payment confirmation",
        ]
    };
    setChecklistData(mockChecklist);
    setIsGeneratingChecklist(false);
  }, [sanitizedDocText, checklistData]);
  // ---

  const renderCurrentView = () => {
    switch (appState) {
      case APP_STATE.AWAITING_UPLOAD:
        return (
          <div className="w-full max-w-4xl h-[90vh] flex flex-col items-center justify-center">
            <UploadComponent onFileUpload={handleFileUpload} />
          </div>
        );

      case APP_STATE.GENERAL_CHAT:
        return (
          <div className="w-full max-w-4xl h-[85vh] flex flex-col">
            <ChatInterface
              messages={messages}
              setMessages={setMessages}
              documentLoaded={false}
              onFileUpload={handleFileUpload}
              contractId={contractId}
            />
          </div>
        );

      case APP_STATE.PROCESSING:
        return <ProcessingComponent fileName={fileName} />;

      case APP_STATE.ANALYSIS:
        return (
          <div className="flex flex-col lg:flex-row gap-6 w-full max-w-7xl h-[85vh] pt-5">
            {/* Left Panel: Now with all three Tabs */}
            <div className="lg:w-2/5 w-full h-full flex flex-col bg-slate-800/40 rounded-xl border border-slate-700/50 p-6">
                <div className="flex-shrink-0 mb-4 border-b border-slate-700">
                    <div className="flex space-x-4">
                        <button 
                            onClick={() => setActiveTab('document')}
                            className={`py-2 px-4 text-sm font-medium transition-colors ${activeTab === 'document' ? 'text-white border-b-2 border-blue-500' : 'text-slate-400 hover:text-white'}`}
                        >
                            Document
                        </button>
                        <button 
                            onClick={handleRiskAnalysis}
                            className={`py-2 px-4 text-sm font-medium transition-colors ${activeTab === 'risks' ? 'text-white border-b-2 border-blue-500' : 'text-slate-400 hover:text-white'}`}
                        >
                            Riskometer
                        </button>
                        <button 
                            onClick={handleGenerateChecklist}
                            className={`py-2 px-4 text-sm font-medium transition-colors ${activeTab === 'checklist' ? 'text-white border-b-2 border-blue-500' : 'text-slate-400 hover:text-white'}`}
                        >
                            Checklist
                        </button>
                    </div>
                </div>
                <div className="flex-grow overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800">
                    {activeTab === 'document' && (
                         <DocumentViewer
                            fileName={fileName}
                            sanitizedDocText={sanitizedDocText}
                        />
                    )}
                    {activeTab === 'risks' && (
                        <RiskDashboard 
                            analysisResults={riskAnalysisResults}
                            isLoading={isAnalyzingRisks}
                        />
                    )}
                    {activeTab === 'checklist' && (
                        <Checklist
                            checklistData={checklistData}
                            isLoading={isGeneratingChecklist}
                        />
                    )}
                </div>
            </div>
            
            {/* Right Panel: Chat Interface */}
            <div className="lg:w-3/5 w-full h-full">
              <ChatInterface
                messages={messages}
                setMessages={setMessages}
                documentLoaded={true}
                sanitizedDocText={sanitizedDocText}
                onFileUpload={handleFileUpload}
                contractId={contractId}
              />
            </div>
          </div>
        );

      default:
        return <div className="text-white">Loading...</div>;
    }
  };

  return (
    <div className="flex justify-center items-center w-full min-h-screen bg-slate-900 p-4">
      {renderCurrentView()}
    </div>
  );
}

