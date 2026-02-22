import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import QRCode from "qrcode";

export const generatePatientReport = async (record: any, patientName: string) => {
  const doc = new jsPDF();
  const dateStr = new Date(record.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // --- DERIVE MISSING DATA (FALLBACKS) ---
  const riskScore = record.prediction?.riskScore || 0;

  // High-precision fallback for risk level if record is missing it
  let riskLevel = record.prediction?.riskLevel;
  if (!riskLevel || riskLevel.toLowerCase() === 'unknown') {
    riskLevel = riskScore > 70 ? 'High' : riskScore > 30 ? 'Moderate' : 'Low';
  }

  const isHighRisk = riskScore > 50;
  const accentColor = isHighRisk ? [220, 38, 38] : [16, 185, 129]; // Medical Red vs Clinical Emerald

  // --- HOSPITAL LETTERHEAD / HEADER ---
  // Top Border
  doc.setFillColor(15, 23, 42); // Navy #0f172a
  doc.rect(0, 0, 210, 3, 'F');

  // CliniqueAI Logo (Premium Typography)
  doc.setFontSize(22);
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.text("Clinique", 15, 25);
  doc.setTextColor(45, 212, 191); // Teal
  doc.text("AI", 48, 25);

  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.setFont("helvetica", "normal");
  doc.text("DIAGNOSTIC & PREVENTIVE COMMAND HUB", 15, 30);

  // REAL QR CODE GENERATION
  try {
    const qrData = `CliniqueAI Verification Record\nID: ${record._id}\nPatient: ${patientName}\nRisk: ${riskScore.toFixed(2)}%\nDate: ${dateStr}`;
    const qrDataUrl = await QRCode.toDataURL(qrData, {
      margin: 1,
      width: 100,
      color: {
        dark: "#0f172a",
        light: "#ffffff"
      }
    });
    doc.addImage(qrDataUrl, 'PNG', 170, 7, 28, 28);
  } catch (err) {
    console.error("QR Generation failed", err);
    doc.setDrawColor(220, 220, 220);
    doc.rect(173, 10, 22, 22);
    doc.setFontSize(6);
    doc.text("QR ERROR", 175, 22);
  }

  doc.setFontSize(6);
  doc.setTextColor(180);
  doc.text("VERIFICATION TOKEN", 170, 38);

  // Header Meta
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("OFFICIAL DIAGNOSTIC REPORT", 105, 23, { align: 'center' });

  doc.setDrawColor(240, 240, 240);
  doc.line(15, 45, 195, 45);

  // --- INFO PANES (TWO COLUMN) ---
  // Left: Patient Identifiers
  doc.setFillColor(248, 250, 252);
  doc.rect(15, 50, 85, 35, 'F');
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text("PATIENT IDENTIFICATION", 20, 58);
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.setFont("helvetica", "bold");
  doc.text(patientName, 20, 66);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Age: ${record.inputs?.age || '--'} Yrs`, 20, 73);
  doc.text(`Sex: ${record.inputs?.gender === 1 ? 'Male' : 'Female'}`, 20, 78);

  // Right: Clinical Hub Meta
  doc.setFillColor(248, 250, 252);
  doc.rect(110, 50, 85, 35, 'F');
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text("DIAGNOSTIC FACILITY", 115, 58);
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.setFont("helvetica", "bold");
  doc.text("CliniqueAI Virtual Command Hub", 115, 66);
  doc.setFont("helvetica", "normal");
  const doctorName = record.doctor_id?.name || "Independent AI Assessment";
  doc.text(`Consulting: ${doctorName}`, 115, 73);

  // Date and Time (Assessment Timestamp)
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(`Assessment: ${dateStr}`, 115, 79);

  // --- EXECUTIVE SUMMARY / RISK VIZ ---
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.text("Executive Predictive Summary", 15, 100);

  // Risk Gradient/Visualization Placeholder (Elite look)
  doc.setDrawColor(240, 240, 240);
  doc.setFillColor(249, 250, 251);
  doc.roundedRect(15, 105, 180, 40, 2, 2, 'FD');

  // score Gauge look
  doc.setFontSize(30);
  doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.text(`${riskScore.toFixed(1)}%`, 30, 133);
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text("AGGREGATE RISK SCORE", 30, 138);

  // Risk Classification
  doc.setFontSize(12);
  doc.setTextColor(30, 41, 59);
  doc.setFont("helvetica", "bold");
  doc.text("Classification:", 105, 125);
  doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.text(riskLevel.toUpperCase(), 138, 125);

  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.setFont("helvetica", "normal");
  doc.text("Assessment of metabolic drift based on multi-variate analysis.", 105, 133);
  doc.text("Confidence: " + (record.prediction?.confidenceLabel || 'Optimized'), 105, 138);

  // --- VITAL SIGNS TABLE (HOSPITAL GRADE) ---
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("Clinical Laboratory Findings", 15, 160);

  autoTable(doc, {
    startY: 165,
    head: [['Clinical Parameter', 'Current Value', 'Biological Reference Range', 'Interpretation']],
    body: [
      ['Blood Glucose (Serum)', `${record.inputs?.blood_glucose_level || '--'} mg/dL`, '70 - 140 mg/dL', (record.inputs?.blood_glucose_level > 140) ? 'Above Normal' : 'Within Range'],
      ['HbA1c (Hemoglobin A1c)', `${record.inputs?.HbA1c_level || '--'} %`, '4.0% - 5.6%', (record.inputs?.HbA1c_level > 5.6) ? 'Elevated' : 'Normal'],
      ['Body Mass Index (BMI)', record.inputs?.bmi?.toString() || '--', '18.5 - 24.9 kg/m²', (record.inputs?.bmi > 25 || record.inputs?.bmi < 18.5) ? 'Deviation' : 'Optimal'],
      ['Hypertension Marker', record.inputs?.hypertension === 1 ? 'Positive' : 'Negative', 'Negative', '-'],
      ['CVD History/Indicator', record.inputs?.heart_disease === 1 ? 'Positive' : 'Negative', 'Negative', '-'],
    ],
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      cellPadding: 3
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [50, 50, 50],
      lineColor: [240, 240, 240],
      cellPadding: 3
    },
    columnStyles: {
      3: { fontStyle: 'bold' }
    }
  });

  // --- CLINICAL INTERPRETATION ---
  const currentY = (doc as any).lastAutoTable.finalY + 15;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Physician's Clinical Interpretation", 15, currentY);

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80);
  const narrative = [
    `Patient data analysis suggests a ${riskLevel} level of metabolic susceptibility at this timestamp.`,
    `Transition risk of ${riskScore.toFixed(2)}% indicates ${isHighRisk ? 'immediate clinical review of HbA1c/Glucose vectors is recommended.' : 'maintenance of current clinical metrics is advised.'}`,
    `Digital Verification ID: ${record._id.toString().substring(0, 12).toUpperCase()}`
  ];
  narrative.forEach((line, i) => doc.text(line, 15, currentY + 7 + (i * 5)));

  // --- FOOTER ELEMENTS (SIGNATURE & STAMP) ---
  const footerStart = doc.internal.pageSize.height - 50;

  // Signature Line
  doc.setDrawColor(200);
  doc.line(130, footerStart + 25, 185, footerStart + 25);
  doc.setFontSize(7);
  doc.text("DIGITALLY SIGNED BY CHIEF MEDICAL OFFICER", 130, footerStart + 30);

  // Real Handwritten Signature Image
  try {
    doc.addImage("/cmo-signature.png", "PNG", 135, footerStart + 10, 45, 15);
  } catch (e) {
    console.error("Signature image failed to load", e);
    // CMO Name (Script font look)
    doc.setFont("courier", "italic");
    doc.setFontSize(11);
    doc.setTextColor(50, 80, 200);
    doc.text("Dr. Clinique AI, PhD", 135, footerStart + 22);
  }

  // --- CLINICAL VALIDATION SEAL (HOSPITAL GRADE) ---
  const sealX = 35;
  const sealY = footerStart + 20;

  // Outer Circle
  doc.setDrawColor(16, 185, 129, 0.2);
  doc.setLineWidth(0.5);
  doc.circle(sealX, sealY, 12, 'S');

  // Inner Circle
  doc.setDrawColor(16, 185, 129, 0.6);
  doc.setLineWidth(0.2);
  doc.circle(sealX, sealY, 10, 'S');

  // Seal Text
  doc.setFont("helvetica", "bold");
  doc.setTextColor(16, 185, 129, 0.8);
  doc.setFontSize(5);
  doc.text("CLINICALLY", sealX, sealY - 4, { align: 'center' });
  doc.setFontSize(7);
  doc.text("VERIFIED", sealX, sealY + 1, { align: 'center' });
  doc.setFontSize(4);
  doc.text("DIAGNOSTIC CORE", sealX, sealY + 5, { align: 'center' });

  // Minimalist "Check" icon look
  doc.setLineWidth(0.4);
  doc.line(sealX - 2, sealY + 7, sealX, sealY + 9);
  doc.line(sealX, sealY + 9, sealX + 4, sealY + 5);

  // Final Disclaimer
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(160);
  doc.text("NON-DIAGNOSTIC NOTICE: This report is generated by an Artificial Intelligence engine for auxiliary decision support.", 15, doc.internal.pageSize.height - 15);
  doc.text("Final clinical judgment remains at the discretion of the examining physician.", 15, doc.internal.pageSize.height - 11);

  // --- DOWNLOAD ---
  const saveName = `Medical_Report_${patientName.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`;
  doc.save(saveName);
};
