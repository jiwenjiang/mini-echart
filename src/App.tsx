import React, { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Loading } from "react-vant";

const Index = lazy(() => import("./pages/index"));
const Sleep = lazy(() => import("./pages/sleep"));

function App() {
  return (
    <BrowserRouter>
      <Suspense
        fallback={
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              width: "100vw",
              height: "100vh",
            }}
          >
            <Loading type="spinner" />
          </div>
        }
      >
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/sleep" element={<Sleep />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
