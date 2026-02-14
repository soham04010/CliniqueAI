import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const generatePatientReport = (patient: any) => {
  const doc = new jsPDF();
  const date = new Date().toLocaleDateString();

  // Header
  doc.setFontSize(22);
  doc.setTextColor(45, 85, 255); // CliniqueAI Blue
  doc.text("CliniqueAI - Clinical Report", 14, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Report Generated On: ${date}`, 14, 28);
  doc.line(14, 32, 196, 32);

  // Patient Info
  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text("Patient Information", 14, 45);
  
  autoTable(doc, {
    startY: 50,
    head: [['Field', 'Detail']],
    body: [
      ['Name', patient.name],
      ['Age', patient.inputs.age.toString()],
      ['Gender', patient.inputs.gender],
      ['Smoking History', patient.inputs.smoking_history],
    ],
    theme: 'grid',
    headStyles: { fillColor: [45, 85, 255] }
  });

  // Risk Assessment Result
  doc.text("AI Risk Assessment", 14, (doc as any).lastAutoTable.finalY + 15);
  
  const riskColor = patient.prediction.riskLevel === 'High' ? [255, 0, 0] : [0, 128, 0];
  
  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 20,
    body: [
      ['Calculated Risk Score', `${patient.prediction.riskScore.toFixed(4)}%`],
      ['Risk Classification', patient.prediction.riskLevel],
    ],
    theme: 'plain',
    styles: { fontSize: 12, fontStyle: 'bold' },
    didParseCell: (data) => {
      if (data.row.index === 1 && data.column.index === 1) {
        data.cell.styles.textColor = riskColor;
      }
    }
  });

  // Clinical Vitals
  doc.text("Clinical Vitals", 14, (doc as any).lastAutoTable.finalY + 15);
  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 20,
    head: [['Vital Sign', 'Value', 'Unit']],
    body: [
      ['Blood Glucose', patient.inputs.blood_glucose_level.toString(), 'mg/dL'],
      ['HbA1c Level', patient.inputs.HbA1c_level.toString(), '%'],
      ['BMI', patient.inputs.bmi.toString(), 'kg/m2'],
      ['Hypertension', patient.inputs.hypertension === 1 ? 'Yes' : 'No', '-'],
      ['Heart Disease', patient.inputs.heart_disease === 1 ? 'Yes' : 'No', '-'],
    ],
    theme: 'striped',
    headStyles: { fillColor: [70, 70, 70] }
  });

  // Footer Disclaimer
  doc.setFontSize(8);
  doc.setTextColor(150);
  const footerY = doc.internal.pageSize.height - 20;
  doc.text("Disclaimer: This is an AI-generated assessment for clinical decision support.", 14, footerY);
  doc.text("Please consult a human physician for a final medical diagnosis.", 14, footerY + 5);

  // Download
  doc.save(`CliniqueAI_Report_${patient.name.replace(/\s+/g, '_')}.pdf`);
};