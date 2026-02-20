

import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";

export default function Hello() {
  return (
    <>
      <PageMeta
         title="VipraGo | Next-Gen Talent & Workflow Orchestrator by Vipra Software Private Limited"
         description="Streamline. Simplify. Scale. – That’s VipraGo. Developed by Vipra Software Private Limited, VipraGo is a next-gen, AI-ready HRMS and workforce automation platform built with React.js and Tailwind CSS. Designed to streamline employee lifecycle, simplify payroll, leave, and attendance, and scale effortlessly across startups and enterprises."
      />
     
      { <AuthLayout>
      </AuthLayout> } 
    </>
  );
}
