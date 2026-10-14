import { Loader } from "@/components/Loader";

// Inside the workbench the sidebar stays; only the content area waits.
export default function Loading() {
  return <Loader full={false} />;
}
