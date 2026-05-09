export async function fetchNakdan(text: string, options: any) {
    try {
        const response = await fetch('https://nakdan-u1-0.loadbalancer.dicta.org.il/api', {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain;charset=UTF-8',
                'Accept': '*/*'
            },
            body: JSON.stringify({
                task: "nakdan",
                data: text,
                addmorph: true,
                useTokenization: true,
                ...options // כאן אנחנו "שופכים" את כל ההגדרות מהממשק
            })
        });

        if (!response.ok) {
            throw new Error(`API call failed with status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Error fetching from Dicta API:", error);
        throw error;
    }
}