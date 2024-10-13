'use client';

export type ModelCardProps = {
    name: string;
    pipeline_tag: string;
    created_at: string;
    updated_at: string;
    ai_model_id: number;
}
export default function ModelCard({ name, pipeline_tag, ai_model_id, created_at, updated_at }: ModelCardProps) {

    return (
        <div
            className="flex flex-col bg-background-600 border border-secondary-200 h-32 w-64 text-sm hover:bg-background-700 cursor-pointer m-2"
            onClick={() => console.log(ai_model_id)}>
            <h2 className="text-primary-200 text-center my-2">{name}</h2>
            <p className="text-primary-200 text-center mb-1">{pipeline_tag}</p>
            <p className="text-primary-200 text-center mb-1">{created_at}</p>
            <p className="text-primary-200 text-center mb-1">{updated_at}</p>
        </div>
    )
}