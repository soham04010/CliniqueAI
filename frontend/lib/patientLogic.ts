export const getHumanStatus = (riskScore: number) => {
    if (riskScore < 30) {
        return {
            status: "Low Risk — Stable",
            color: "bg-emerald-100 text-emerald-800",
            iconColor: "text-emerald-600",
            message: "Your health indicators are stable. Keep up your current routine.",
            level: "low"
        };
    } else if (riskScore < 60) {
        return {
            status: "Moderate Risk — Slightly Increasing",
            color: "bg-amber-100 text-amber-800",
            iconColor: "text-amber-600",
            message: "Your risk is slightly elevated. Small lifestyle changes can help.",
            level: "moderate"
        };
    } else {
        return {
            status: "High Risk — Needs Attention",
            color: "bg-rose-100 text-rose-800",
            iconColor: "text-rose-600",
            message: "Your risk indicators require attention. Please consult your doctor.",
            level: "high"
        };
    }
};

export const getDeltas = (current: any, history: any[]) => {
    if (!history || history.length === 0) return [];

    // Sort history by date descending, skip the current record if it's the first one
    const sortedHistory = [...history].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const previous = sortedHistory.length > 1 ? sortedHistory[1] : sortedHistory[0]; // Compare with previous or self if only 1

    // If no previous data (only 1 record), return empty or initial state
    if (sortedHistory.length <= 1) return [{ text: "First record established.", positive: true }];

    const deltas = [];

    // BMI
    const bmiDiff = (current.bmi - previous.inputs.bmi).toFixed(1);
    if (Math.abs(Number(bmiDiff)) > 0.1) {
        deltas.push({
            text: `Your BMI ${Number(bmiDiff) > 0 ? 'increased' : 'decreased'} by ${Math.abs(Number(bmiDiff))}`,
            positive: Number(bmiDiff) < 0 // Decrease is good for BMI usually
        });
    }

    // HbA1c
    const hba1cDiff = (current.HbA1c_level - previous.inputs.HbA1c_level).toFixed(1);
    if (Math.abs(Number(hba1cDiff)) > 0.1) {
        deltas.push({
            text: `Your HbA1c ${Number(hba1cDiff) > 0 ? 'rose' : 'improved'} by ${Math.abs(Number(hba1cDiff))}`,
            positive: Number(hba1cDiff) < 0
        });
    }

    // Glucose
    const glucoseDiff = current.blood_glucose_level - previous.inputs.blood_glucose_level;
    if (Math.abs(glucoseDiff) > 5) {
        deltas.push({
            text: `Your glucose is trending ${glucoseDiff > 0 ? 'upward' : 'downward'}`,
            positive: glucoseDiff < 0
        });
    }

    return deltas.length > 0 ? deltas : [{ text: "No significant changes since last visit.", positive: true }];
};

export const generateActionPlan = (inputs: any) => {
    const plans = [];

    // Glucose
    if (inputs.blood_glucose_level > 140) {
        plans.push({ text: "Walk 15 minutes after dinner", category: "Movement" });
        plans.push({ text: "Reduce sugary drinks today", category: "Diet" });
    } else {
        plans.push({ text: "Maintain steady hydration (2L water)", category: "General" });
    }

    // BMI
    if (inputs.bmi > 25) {
        plans.push({ text: "Try a fiber-rich breakfast tomorrow", category: "Diet" });
    }

    // General
    plans.push({ text: "Update your vitals in 7 days", category: "Tracking" });

    return plans.slice(0, 3); // Max 3 items
};
