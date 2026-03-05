"use client";
import Test from "@/test/testt";
import { useState, useEffect } from "react";

export default function Home() {
  async function runTest() {
    const test = new Test(1);
    const result = await test.Test1LB2S();
    console.log(result);
    setResult(result);
  }

  useEffect(() => {
    runTest();
  }, []);

  const [result, setResult] = useState<any>(null);
  return (
    <div>
      {result && <pre>{JSON.stringify(result, null, 2)}</pre>}
    </div>
  );
}
