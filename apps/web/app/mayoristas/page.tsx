import { Suspense } from "react";
import { WholesaleWorkspace } from "../../components/wholesale-workspace";

export default function WholesalePage() {
  return (
    <Suspense fallback={null}>
      <WholesaleWorkspace />
    </Suspense>
  );
}
