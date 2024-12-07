"use client";

import { Button } from "@/components/ui/button";
import { PanelRightClose, PanelRightOpen } from "lucide-react";
import {
  ReactFlowProvider,
} from "@xyflow/react";
// import { ConceptNode } from "@/lib/engine/nodes/concept-node";
// import { InsightNode } from "@/lib/engine/nodes/insight-node";
import { useState } from "react";
import DetailPaneView from "@/components/ui/detail-pane-views/detail-pane-view";
import { ReactFlowCanvas } from "@/components/ui/reactflow/reactflow_canvas";

export default function Home() {
  const [detailPaneOpen, setDetailPaneOpen] = useState(false);

  return (
    <div className="flex flex-row w-full h-screen divide-x">
      {/* Main content */}
      <div className="w-full flex flex-col divide-y">
        <div className="px-4 py-2 flex flex-row bg-background justify-between items-center">
          <p className="p-2 text-3xl font-mono text-primary">LiRA</p>
          <Button
            variant={detailPaneOpen ? "default" : "outline"}
            size="icon"
            onClick={() => setDetailPaneOpen(!detailPaneOpen)}
          >
            {detailPaneOpen ? <PanelRightClose /> : <PanelRightOpen />}
          </Button>
        </div>
        {/* React flow canvas */}
        <ReactFlowProvider>
          <ReactFlowCanvas setDetailPaneOpen={setDetailPaneOpen} />
        </ReactFlowProvider>
        {/* Detail pane */}
      </div>
      {detailPaneOpen && <DetailPaneView />}
    </div>
  );
}
