import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";

/**
 * Export Service for Custom Reports
 * Handles PDF and Excel generation from report data
 */

export class ReportExportService {
  /**
   * Generate PDF report
   */
  static async generatePDF(reportData, config) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50, size: "A4" });
        const chunks = [];

        // Collect PDF chunks
        doc.on("data", (chunk) => chunks.push(chunk));
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", reject);

        // Header
        doc.fontSize(24).font("Helvetica-Bold").text(reportData.reportName || "Custom Report", { align: "center" });

        doc.moveDown(0.5);
        doc.fontSize(10).font("Helvetica").text(`Generated: ${new Date(reportData.generatedAt).toLocaleString()}`, { align: "center" });

        // Date Range
        if (reportData.dateRange) {
          const startStr = reportData.dateRange.startDate ? new Date(reportData.dateRange.startDate).toLocaleDateString() : "Beginning";
          const endStr = new Date(reportData.dateRange.endDate).toLocaleDateString();
          doc.text(`Period: ${startStr} - ${endStr}`, { align: "center" });
        }

        doc.moveDown(2);

        // Summary Metrics
        doc.fontSize(16).font("Helvetica-Bold").text("Summary", { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(11).font("Helvetica");

        if (reportData.totalApplications !== undefined) {
          doc.text(`Total Applications: ${reportData.totalApplications}`);
        }

        if (reportData.interviewConversionRate) {
          doc.text(`Interview Conversion Rate: ${reportData.interviewConversionRate.rate}%`);
        }

        if (reportData.offerConversionRate) {
          doc.text(`Offer Conversion Rate: ${reportData.offerConversionRate.rate}%`);
        }

        if (reportData.averageResponseTime) {
          doc.text(`Average Response Time: ${reportData.averageResponseTime.averageDays} days`);
        }

        doc.moveDown(1.5);

        // Applications by Status
        if (reportData.applicationsByStatus && reportData.applicationsByStatus.length > 0) {
          doc.fontSize(14).font("Helvetica-Bold").text("Applications by Status");
          doc.moveDown(0.5);
          doc.fontSize(10).font("Helvetica");

          reportData.applicationsByStatus.forEach((item) => {
            doc.text(`  ${item.status}: ${item.count} (${item.percentage}%)`);
          });

          doc.moveDown(1);
        }

        // Top Companies
        if (reportData.topCompanies && reportData.topCompanies.length > 0) {
          doc.fontSize(14).font("Helvetica-Bold").text("Top Companies");
          doc.moveDown(0.5);
          doc.fontSize(10).font("Helvetica");

          reportData.topCompanies.slice(0, 10).forEach((item, index) => {
            doc.text(`  ${index + 1}. ${item.company}: ${item.count} applications`);
          });

          doc.moveDown(1);
        }

        // Top Industries
        if (reportData.topIndustries && reportData.topIndustries.length > 0) {
          doc.fontSize(14).font("Helvetica-Bold").text("Top Industries");
          doc.moveDown(0.5);
          doc.fontSize(10).font("Helvetica");

          reportData.topIndustries.slice(0, 10).forEach((item, index) => {
            doc.text(`  ${index + 1}. ${item.industry}: ${item.count} applications`);
          });

          doc.moveDown(1);
        }

        // AI Insights
        if (reportData.aiInsights && reportData.aiInsights.length > 0) {
          // Check if we need a new page
          if (doc.y > 650) {
            doc.addPage();
          }

          doc.fontSize(16).font("Helvetica-Bold").text("AI-Powered Insights", { underline: true });
          doc.moveDown(0.5);
          doc.fontSize(10).font("Helvetica");

          reportData.aiInsights.forEach((insight, index) => {
            doc.fontSize(11).font("Helvetica-Bold").text(`${index + 1}. ${insight.title}`);
            doc.fontSize(10).font("Helvetica").text(insight.content, { indent: 20 });
            doc.moveDown(0.5);

            // Check if we need a new page
            if (doc.y > 700) {
              doc.addPage();
            }
          });
        }

        // Footer
        const pageCount = doc.bufferedPageRange().count;
        for (let i = 0; i < pageCount; i++) {
          doc.switchToPage(i);
          doc.fontSize(8).font("Helvetica").text(`Page ${i + 1} of ${pageCount}`, 50, doc.page.height - 50, { align: "center" });
        }

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generate Excel report
   */
  static async generateExcel(reportData, config) {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "HotSho Job Search Platform";
    workbook.created = new Date();

    // Summary Sheet
    const summarySheet = workbook.addWorksheet("Summary");
    this.createSummarySheet(summarySheet, reportData);

    // Applications by Status Sheet
    if (reportData.applicationsByStatus && reportData.applicationsByStatus.length > 0) {
      const statusSheet = workbook.addWorksheet("By Status");
      this.createStatusSheet(statusSheet, reportData.applicationsByStatus);
    }

    // Applications by Industry Sheet
    if (reportData.applicationsByIndustry && reportData.applicationsByIndustry.length > 0) {
      const industrySheet = workbook.addWorksheet("By Industry");
      this.createIndustrySheet(industrySheet, reportData.applicationsByIndustry);
    }

    // Applications by Company Sheet
    if (reportData.applicationsByCompany && reportData.applicationsByCompany.length > 0) {
      const companySheet = workbook.addWorksheet("By Company");
      this.createCompanySheet(companySheet, reportData.applicationsByCompany);
    }

    // Application Trend Sheet
    if (reportData.applicationTrend && reportData.applicationTrend.length > 0) {
      const trendSheet = workbook.addWorksheet("Application Trend");
      this.createTrendSheet(trendSheet, reportData.applicationTrend);
    }

    // Raw Jobs Data Sheet
    if (reportData.jobs && reportData.jobs.length > 0) {
      const jobsSheet = workbook.addWorksheet("Raw Data");
      this.createJobsDataSheet(jobsSheet, reportData.jobs);
    }

    // AI Insights Sheet
    if (reportData.aiInsights && reportData.aiInsights.length > 0) {
      const insightsSheet = workbook.addWorksheet("AI Insights");
      this.createInsightsSheet(insightsSheet, reportData.aiInsights);
    }

    return await workbook.xlsx.writeBuffer();
  }

  /**
   * Create Summary Sheet
   */
  static createSummarySheet(sheet, reportData) {
    // Title
    sheet.mergeCells("A1:B1");
    sheet.getCell("A1").value = reportData.reportName || "Custom Report";
    sheet.getCell("A1").font = { size: 16, bold: true };
    sheet.getCell("A1").alignment = { horizontal: "center" };

    // Generated Date
    sheet.mergeCells("A2:B2");
    sheet.getCell("A2").value = `Generated: ${new Date(reportData.generatedAt).toLocaleString()}`;
    sheet.getCell("A2").alignment = { horizontal: "center" };

    // Date Range
    if (reportData.dateRange) {
      sheet.mergeCells("A3:B3");
      const startStr = reportData.dateRange.startDate ? new Date(reportData.dateRange.startDate).toLocaleDateString() : "Beginning";
      const endStr = new Date(reportData.dateRange.endDate).toLocaleDateString();
      sheet.getCell("A3").value = `Period: ${startStr} - ${endStr}`;
      sheet.getCell("A3").alignment = { horizontal: "center" };
    }

    let row = 5;

    // Key Metrics
    sheet.getCell(`A${row}`).value = "Metric";
    sheet.getCell(`B${row}`).value = "Value";
    sheet.getRow(row).font = { bold: true };
    row++;

    if (reportData.totalApplications !== undefined) {
      sheet.getCell(`A${row}`).value = "Total Applications";
      sheet.getCell(`B${row}`).value = reportData.totalApplications;
      row++;
    }

    if (reportData.interviewConversionRate) {
      sheet.getCell(`A${row}`).value = "Interview Conversion Rate";
      sheet.getCell(`B${row}`).value = `${reportData.interviewConversionRate.rate}%`;
      row++;
    }

    if (reportData.offerConversionRate) {
      sheet.getCell(`A${row}`).value = "Offer Conversion Rate";
      sheet.getCell(`B${row}`).value = `${reportData.offerConversionRate.rate}%`;
      row++;
    }

    if (reportData.averageResponseTime) {
      sheet.getCell(`A${row}`).value = "Average Response Time";
      sheet.getCell(`B${row}`).value = `${reportData.averageResponseTime.averageDays} days`;
      row++;
    }

    if (reportData.ghostedApplications !== undefined) {
      sheet.getCell(`A${row}`).value = "Ghosted Applications";
      sheet.getCell(`B${row}`).value = reportData.ghostedApplications;
      row++;
    }

    // Formatting
    sheet.getColumn("A").width = 30;
    sheet.getColumn("B").width = 20;
  }

  /**
   * Create Status Sheet
   */
  static createStatusSheet(sheet, data) {
    sheet.columns = [
      { header: "Status", key: "status", width: 20 },
      { header: "Count", key: "count", width: 15 },
      { header: "Percentage", key: "percentage", width: 15 },
    ];

    sheet.getRow(1).font = { bold: true };
    data.forEach((item) => {
      sheet.addRow({
        status: item.status,
        count: item.count,
        percentage: `${item.percentage}%`,
      });
    });
  }

  /**
   * Create Industry Sheet
   */
  static createIndustrySheet(sheet, data) {
    sheet.columns = [
      { header: "Industry", key: "industry", width: 30 },
      { header: "Count", key: "count", width: 15 },
      { header: "Percentage", key: "percentage", width: 15 },
    ];

    sheet.getRow(1).font = { bold: true };
    data.forEach((item) => {
      sheet.addRow({
        industry: item.industry,
        count: item.count,
        percentage: `${item.percentage}%`,
      });
    });
  }

  /**
   * Create Company Sheet
   */
  static createCompanySheet(sheet, data) {
    sheet.columns = [
      { header: "Company", key: "company", width: 30 },
      { header: "Count", key: "count", width: 15 },
    ];

    sheet.getRow(1).font = { bold: true };
    data.forEach((item) => {
      sheet.addRow({
        company: item.company,
        count: item.count,
      });
    });
  }

  /**
   * Create Trend Sheet
   */
  static createTrendSheet(sheet, data) {
    sheet.columns = [
      { header: "Period", key: "period", width: 20 },
      { header: "Count", key: "count", width: 15 },
    ];

    sheet.getRow(1).font = { bold: true };
    data.forEach((item) => {
      sheet.addRow({
        period: item.period,
        count: item.count,
      });
    });
  }

  /**
   * Create Jobs Data Sheet
   */
  static createJobsDataSheet(sheet, jobs) {
    sheet.columns = [
      { header: "Company", key: "company", width: 25 },
      { header: "Title", key: "title", width: 30 },
      { header: "Status", key: "status", width: 15 },
      { header: "Industry", key: "industry", width: 20 },
      { header: "Location", key: "location", width: 20 },
      { header: "Applied Date", key: "appliedDate", width: 15 },
      { header: "Source", key: "source", width: 15 },
    ];

    sheet.getRow(1).font = { bold: true };
    jobs.forEach((job) => {
      sheet.addRow({
        company: job.company,
        title: job.title,
        status: job.status,
        industry: job.industry,
        location: job.location,
        appliedDate: job.appliedDate ? new Date(job.appliedDate).toLocaleDateString() : "",
        source: job.source,
      });
    });
  }

  /**
   * Create Insights Sheet
   */
  static createInsightsSheet(sheet, insights) {
    sheet.columns = [
      { header: "Insight", key: "title", width: 30 },
      { header: "Details", key: "content", width: 80 },
    ];

    sheet.getRow(1).font = { bold: true };
    insights.forEach((insight) => {
      const row = sheet.addRow({
        title: insight.title,
        content: insight.content,
      });
      row.getCell("B").alignment = { wrapText: true };
    });
  }
}
