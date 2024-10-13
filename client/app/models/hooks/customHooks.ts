import { useState, useEffect } from "react";
import { error_toast } from "@/app/utils/utils";
import { ModelDetails } from "@/app/models/page";

export const useFetchModels = () => {
    const [models, setModels] = useState<ModelDetails[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchModelItems = async () => {
            try {
                const response = await fetch('http://127.0.0.1:8000/get_models/');
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
                setModels(data.models);
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

    return { models, loading };
};