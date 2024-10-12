'use client';
import ModelCard from "@/app/models/components/ModelCard";
import {useEffect, useState} from "react";
import Loader from "@/app/components/Loader";
import {error_toast} from "@/app/lib/utils";

export type ModelDetails = {
    ai_model_id: number;
    name: string;

}

export default function ModelsPage() {
    const [models, setModels] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const fetchModelItems = async () => {
            try {
                const response = await fetch('http://127.0.0.1:8000/get_models');
                if (!response.ok) {
                    error_toast('Failed to fetch data');
                    return;
                }
                const data = await response.json();
                if (data.success === false) {
                    error_toast(data.message);
                    setLoading(false);
                    return;
                }
                setModels(data);
                setLoading(false);
            } catch (error) {
                if (error instanceof Error) {
                    error_toast(`An error occurred: ${error.message}`);
                } else {
                    error_toast('An unknown error occurred');
                }
                setLoading(false);
            }
        };
        fetchModelItems();
    }, []);

    return (
        <>
            {loading && <Loader/>}
            <div className="flex flex-wrap justify-center">
                {models.map(({ name, description, modelType, modelID }) => (
                    <ModelCard key={modelID} name={name} description={description} modelType={modelType} modelID={modelID} />
                ))}
            </div>
        </>
    );
}