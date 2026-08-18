import React from "react";
import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import PracticeHome from "./pages/PracticeHome";
import QuestionBank from "./pages/QuestionBank";
import BuildTest from "./pages/BuildTest";
import Performance from "./pages/Performance";
import MistakeReview from "./pages/MistakeReview";
import PracticeRunner from "./pages/PracticeRunner";
import PracticeResults from "./pages/PracticeResults";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/practice" element={<PracticeHome />} />
        <Route path="/bank" element={<QuestionBank />} />
        <Route path="/build" element={<BuildTest />} />
        <Route path="/performance" element={<Performance />} />
        <Route path="/mistakes" element={<MistakeReview />} />
        <Route path="/practice/:sessionId" element={<PracticeRunner />} />
        <Route path="/practice/:sessionId/results" element={<PracticeResults />} />
      </Route>
    </Routes>
  );
}
