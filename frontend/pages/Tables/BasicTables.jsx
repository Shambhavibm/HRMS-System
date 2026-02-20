

import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import BasicTableOne from "../../components/tables/BasicTables/BasicTableOne";

export default function BasicTables() {
  return (
    <>
      <PageMeta
          title="VipraGo | Next-Gen Talent & Workflow Orchestrator by Vipra Software Private Limited"
          description="Streamline. Simplify. Scale. – That’s VipraGo. Developed by Vipra Software Private Limited, VipraGo is a next-gen, AI-ready HRMS and workforce automation platform built with React.js and Tailwind CSS. Designed to streamline employee lifecycle, simplify payroll, leave, and attendance, and scale effortlessly across startups and enterprises."
      />

      <PageBreadcrumb pageTitle="Basic Tables" />
      <div className="space-y-6">
        <ComponentCard title="Basic Table 1">
          <BasicTableOne />
        </ComponentCard>
      </div>
    </>
  );
}
