'use client';
import ModelCard from "@/app/models/components/ModelCard";
import Loader from "@/app/components/Loader";
import {useFetchModels} from "@/app/models/hooks/customHooks";

export type ModelDetails = {
    ai_model_id: number;
    name: string;
    pipeline_tag: string;
    created_at: string;
    updated_at: string;

}

export default function ModelsPage() {
    const { models, loading } = useFetchModels();

    return (
        <>
            {loading && <Loader/>}
            <div className="flex flex-wrap justify-center">
                {models.map(({ name, pipeline_tag, ai_model_id, created_at, updated_at }) => (
                    <ModelCard key={ai_model_id} name={name} pipeline_tag={pipeline_tag} ai_model_id={ai_model_id} created_at={created_at} updated_at={updated_at} />
                ))}
            </div>
        </>
    );
}