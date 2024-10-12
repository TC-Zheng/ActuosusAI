'use client';

export type ModelCardProps = {
    name: string;
    description: string;
    modelType: string;
    modelID: number;
}
export default function ModelCard({ name, description, modelType, modelID }: ModelCardProps) {

    return (
        <div
            className="flex flex-col bg-background-600 border border-secondary-200 h-32 w-64 text-sm hover:bg-background-700 cursor-pointer m-2"
            onClick={() => console.log(modelID)}>
            <h2 className="text-primary-200 text-center my-2">{name}</h2>
            <p className="text-primary-200 text-center mb-1">{modelType}</p>
            <p className="text-primary-200 text-center">{description}</p>
        </div>
    )
}