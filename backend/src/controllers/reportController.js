import { ReportConfiguration } from "../models/ReportConfiguration.js";
import { SharedReport } from "../models/SharedReport.js";
import { ReportAggregationService } from "../utils/reportAggregationService.js";
import { ReportExportService } from "../utils/reportExportService.js";
import { ReportInsightService } from "../utils/reportInsightService.js";
import { successResponse, errorResponse, sendResponse, ERROR_CODES } from "../utils/responseFormat.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const getUserId = (req) => {
  const auth = typeof req.auth === 'function' ? req.auth() : req.auth;
  return auth?.userId || auth?.payload?.sub;
};

/**
 * Report Management Endpoints
 */

// POST /api/reports/config - Save a new report configuration
export const createReportConfig = asyncHandler(async (req, res) => {
  const userId = getUserId(req);

  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  const configData = { ...req.body, userId };

  const reportConfig = await ReportConfiguration.create(configData);

  const { response, statusCode } = successResponse("Report configuration created", { reportConfig }, 201);
  return sendResponse(res, response, statusCode);
});

// GET /api/reports/config - List saved reports and system templates
export const getReportConfigs = asyncHandler(async (req, res) => {
  const userId = getUserId(req);

  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  const { includeTemplates } = req.query;

  // Get user's saved reports
  const userReports = await ReportConfiguration.find({ userId, isTemplate: false }).sort({ createdAt: -1 });

  // Get system templates if requested
  let systemTemplates = [];
  if (includeTemplates === "true") {
    systemTemplates = await ReportConfiguration.find({ isTemplate: true, isPublic: true }).sort({ templateCategory: 1, name: 1 });
  }

  const { response, statusCode } = successResponse("Report configurations fetched", {
    userReports,
    systemTemplates,
    totalUserReports: userReports.length,
    totalTemplates: systemTemplates.length,
  });
  return sendResponse(res, response, statusCode);
});

// GET /api/reports/config/:id - Get a specific report configuration
export const getReportConfigById = asyncHandler(async (req, res) => {
  const userId = getUserId(req);
  const { id } = req.params;

  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  const reportConfig = await ReportConfiguration.findOne({
    _id: id,
    $or: [{ userId }, { isTemplate: true, isPublic: true }],
  });

  if (!reportConfig) {
    const { response, statusCode } = errorResponse("Report configuration not found", 404, ERROR_CODES.NOT_FOUND);
    return sendResponse(res, response, statusCode);
  }

  const { response, statusCode } = successResponse("Report configuration fetched", { reportConfig });
  return sendResponse(res, response, statusCode);
});

// PUT /api/reports/config/:id - Update a saved report
export const updateReportConfig = asyncHandler(async (req, res) => {
  const userId = getUserId(req);
  const { id } = req.params;

  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  const reportConfig = await ReportConfiguration.findOne({ _id: id, userId, isTemplate: false });

  if (!reportConfig) {
    const { response, statusCode } = errorResponse("Report configuration not found", 404, ERROR_CODES.NOT_FOUND);
    return sendResponse(res, response, statusCode);
  }

  // Update fields
  Object.assign(reportConfig, req.body);
  await reportConfig.save();

  const { response, statusCode } = successResponse("Report configuration updated", { reportConfig });
  return sendResponse(res, response, statusCode);
});

// DELETE /api/reports/config/:id - Delete a report
export const deleteReportConfig = asyncHandler(async (req, res) => {
  const userId = getUserId(req);
  const { id } = req.params;

  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  const result = await ReportConfiguration.deleteOne({ _id: id, userId, isTemplate: false });

  if (result.deletedCount === 0) {
    const { response, statusCode } = errorResponse("Report configuration not found", 404, ERROR_CODES.NOT_FOUND);
    return sendResponse(res, response, statusCode);
  }

  const { response, statusCode } = successResponse("Report configuration deleted");
  return sendResponse(res, response, statusCode);
});

/**
 * Report Generation Endpoint
 */

// POST /api/reports/generate - Generate a report from configuration
export const generateReport = asyncHandler(async (req, res) => {
  const userId = getUserId(req);

  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  const { configId, adHocConfig } = req.body;

  let config;

  // Use saved configuration or ad-hoc configuration
  if (configId) {
    config = await ReportConfiguration.findOne({
      _id: configId,
      $or: [{ userId }, { isTemplate: true, isPublic: true }],
    });

    if (!config) {
      const { response, statusCode } = errorResponse("Report configuration not found", 404, ERROR_CODES.NOT_FOUND);
      return sendResponse(res, response, statusCode);
    }

    // Update generation metadata
    config.lastGenerated = new Date();
    config.generationCount += 1;
    await config.save();
  } else if (adHocConfig) {
    config = adHocConfig;
  } else {
    const { response, statusCode } = errorResponse(
      "Either configId or adHocConfig must be provided",
      400,
      ERROR_CODES.MISSING_REQUIRED_FIELD
    );
    return sendResponse(res, response, statusCode);
  }

  // Aggregate data
  const reportData = await ReportAggregationService.aggregateReportData(userId, config);

  // Generate AI insights if enabled
  if (config.includeAIInsights) {
    try {
      const insights = await ReportInsightService.generateInsights(reportData, config);
      reportData.aiInsights = insights;
    } catch (error) {
      console.error("Error generating AI insights:", error);
      reportData.aiInsights = [];
    }
  }

  const { response, statusCode } = successResponse("Report generated", {
    reportData,
    configId: config._id,
    configName: config.name,
  });
  return sendResponse(res, response, statusCode);
});

/**
 * Export Endpoints
 */

// GET /api/reports/:id/export/pdf - Export report as PDF
export const exportReportPDF = asyncHandler(async (req, res) => {
  const userId = getUserId(req);
  const { id } = req.params;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Get the report configuration
  const config = await ReportConfiguration.findOne({
    _id: id,
    $or: [{ userId }, { isTemplate: true, isPublic: true }],
  });

  if (!config) {
    return res.status(404).json({ error: "Report configuration not found" });
  }

  // Generate report data
  const reportData = await ReportAggregationService.aggregateReportData(userId, config);

  // Generate AI insights if enabled
  if (config.includeAIInsights) {
    try {
      const insights = await ReportInsightService.generateInsights(reportData, config);
      reportData.aiInsights = insights;
    } catch (error) {
      console.error("Error generating AI insights for PDF:", error);
      reportData.aiInsights = [];
    }
  }

  // Generate PDF
  const pdfBuffer = await ReportExportService.generatePDF(reportData, config);

  // Set response headers
  const filename = `${config.name.replace(/[^a-z0-9]/gi, "_")}_${new Date().toISOString().split("T")[0]}.pdf`;
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.setHeader("Content-Length", pdfBuffer.length);

  res.send(pdfBuffer);
});

// GET /api/reports/:id/export/excel - Export report as Excel
export const exportReportExcel = asyncHandler(async (req, res) => {
  const userId = getUserId(req);
  const { id } = req.params;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Get the report configuration
  const config = await ReportConfiguration.findOne({
    _id: id,
    $or: [{ userId }, { isTemplate: true, isPublic: true }],
  });

  if (!config) {
    return res.status(404).json({ error: "Report configuration not found" });
  }

  // Generate report data
  const reportData = await ReportAggregationService.aggregateReportData(userId, config);

  // Generate AI insights if enabled
  if (config.includeAIInsights) {
    try {
      const insights = await ReportInsightService.generateInsights(reportData, config);
      reportData.aiInsights = insights;
    } catch (error) {
      console.error("Error generating AI insights for Excel:", error);
      reportData.aiInsights = [];
    }
  }

  // Generate Excel
  const excelBuffer = await ReportExportService.generateExcel(reportData, config);

  // Set response headers
  const filename = `${config.name.replace(/[^a-z0-9]/gi, "_")}_${new Date().toISOString().split("T")[0]}.xlsx`;
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.setHeader("Content-Length", excelBuffer.length);

  res.send(excelBuffer);
});

/**
 * Sharing Endpoints
 */

// POST /api/reports/:id/share - Create a shareable link
export const shareReport = asyncHandler(async (req, res) => {
  const userId = getUserId(req);
  const { id } = req.params;
  const { expirationDays = 7, password, allowedEmails, shareMessage, sharedWith } = req.body;

  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  // Get the report configuration
  const config = await ReportConfiguration.findOne({ _id: id, userId });

  if (!config) {
    const { response, statusCode } = errorResponse("Report configuration not found", 404, ERROR_CODES.NOT_FOUND);
    return sendResponse(res, response, statusCode);
  }

  // Generate report data snapshot
  const reportData = await ReportAggregationService.aggregateReportData(userId, config);

  // Generate AI insights if enabled
  if (config.includeAIInsights) {
    try {
      const insights = await ReportInsightService.generateInsights(reportData, config);
      reportData.aiInsights = insights;
    } catch (error) {
      console.error("Error generating AI insights for sharing:", error);
      reportData.aiInsights = [];
    }
  }

  // Create expiration date
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + expirationDays);

  // Create shared report
  const sharedReport = await SharedReport.create({
    reportConfigId: config._id,
    userId,
    reportName: config.name,
    reportSnapshot: reportData,
    expirationDate,
    password,
    allowedEmails,
    shareMessage,
    sharedWith,
  });

  const shareUrl = `${req.protocol}://${req.get("host")}/api/public/reports/${sharedReport.uniqueToken}`;

  const { response, statusCode } = successResponse(
    "Report shared successfully",
    {
      sharedReport: {
        id: sharedReport._id,
        token: sharedReport.uniqueToken,
        shareUrl,
        expirationDate: sharedReport.expirationDate,
        reportName: sharedReport.reportName,
      },
    },
    201
  );
  return sendResponse(res, response, statusCode);
});

// GET /api/public/reports/:token - View a shared report (public endpoint)
export const viewSharedReport = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password, email } = req.query;

  const sharedReport = await SharedReport.findOne({ uniqueToken: token });

  if (!sharedReport) {
    const { response, statusCode } = errorResponse("Shared report not found", 404, ERROR_CODES.NOT_FOUND);
    return sendResponse(res, response, statusCode);
  }

  // Check if share is still valid
  if (!sharedReport.isValid()) {
    const { response, statusCode } = errorResponse("This shared report has expired", 403, ERROR_CODES.FORBIDDEN);
    return sendResponse(res, response, statusCode);
  }

  // Check password if required
  if (sharedReport.password && sharedReport.password !== password) {
    const { response, statusCode } = errorResponse("Invalid password", 403, ERROR_CODES.FORBIDDEN);
    return sendResponse(res, response, statusCode);
  }

  // Check email whitelist if required
  if (sharedReport.allowedEmails && sharedReport.allowedEmails.length > 0) {
    if (!email || !sharedReport.allowedEmails.includes(email)) {
      const { response, statusCode } = errorResponse("Access denied. Your email is not authorized.", 403, ERROR_CODES.FORBIDDEN);
      return sendResponse(res, response, statusCode);
    }
  }

  // Log access
  await sharedReport.logAccess({
    ipAddress: req.ip,
    userAgent: req.get("user-agent"),
    email: email || null,
  });

  const { response, statusCode } = successResponse("Shared report fetched", {
    reportData: sharedReport.reportSnapshot,
    reportName: sharedReport.reportName,
    shareMessage: sharedReport.shareMessage,
    expirationDate: sharedReport.expirationDate,
  });
  return sendResponse(res, response, statusCode);
});

// GET /api/reports/shared - Get user's shared reports
export const getUserSharedReports = asyncHandler(async (req, res) => {
  const userId = getUserId(req);

  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  const sharedReports = await SharedReport.find({ userId }).sort({ createdAt: -1 }).select("-reportSnapshot -accessLog");

  const { response, statusCode } = successResponse("Shared reports fetched", { sharedReports });
  return sendResponse(res, response, statusCode);
});

// DELETE /api/reports/shared/:id - Revoke a shared report
export const revokeSharedReport = asyncHandler(async (req, res) => {
  const userId = getUserId(req);
  const { id } = req.params;

  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  const sharedReport = await SharedReport.findOne({ _id: id, userId });

  if (!sharedReport) {
    const { response, statusCode } = errorResponse("Shared report not found", 404, ERROR_CODES.NOT_FOUND);
    return sendResponse(res, response, statusCode);
  }

  sharedReport.isActive = false;
  await sharedReport.save();

  const { response, statusCode } = successResponse("Shared report revoked");
  return sendResponse(res, response, statusCode);
});
