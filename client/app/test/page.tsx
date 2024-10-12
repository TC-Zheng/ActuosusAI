'use client';
import ModelCard from "@/app/models/components/ModelCard";
import {toast} from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

export default function Page() {
  return (
    <div onClick={() => toast("hello", {position: "bottom-center"}) }>
      <ModelCard name="name" description="description" modelType="modelType" modelID={1} />
    </div>
  );
}