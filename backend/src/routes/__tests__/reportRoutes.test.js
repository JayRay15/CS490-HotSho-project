import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';

const mockCreateReportConfig = jest.fn((req, res) => res.json({ success: true, data: {} }));
const mockGetReportConfigs = jest.fn((req, res) => res.json({ success: true, data: [] }));
const mockGetReportConfigById = jest.fn((req, res) => res.json({ success: true, data: {} }));
const mockUpdateReportConfig = jest.fn((req, res) => res.json({ success: true }));
const mockDeleteReportConfig = jest.fn((req, res) => res.json({ success: true }));
const mockGenerateReport = jest.fn((req, res) => res.json({ success: true, data: {} }));
const mockExportReportPDF = jest.fn((req, res) => res.json({ success: true }));
const mockExportReportExcel = jest.fn((req, res) => res.json({ success: true }));
const mockShareReport = jest.fn((req, res) => res.json({ success: true }));
const mockViewSharedReport = jest.fn((req, res) => res.json({ success: true, data: {} }));
const mockGetUserSharedReports = jest.fn((req, res) => res.json({ success: true, data: [] }));
const mockRevokeSharedReport = jest.fn((req, res) => res.json({ success: true }));

jest.unstable_mockModule('../../controllers/reportController.js', () => ({
    createReportConfig: mockCreateReportConfig,
    getReportConfigs: mockGetReportConfigs,
    getReportConfigById: mockGetReportConfigById,
    updateReportConfig: mockUpdateReportConfig,
    deleteReportConfig: mockDeleteReportConfig,
    generateReport: mockGenerateReport,
    exportReportPDF: mockExportReportPDF,
    exportReportExcel: mockExportReportExcel,
    shareReport: mockShareReport,
    viewSharedReport: mockViewSharedReport,
    getUserSharedReports: mockGetUserSharedReports,
    revokeSharedReport: mockRevokeSharedReport,
}));

const mockCheckJwt = jest.fn((req, res, next) => {
    req.auth = { userId: 'test-user-id' };
    next();
});

jest.unstable_mockModule('../../middleware/checkJwt.js', () => ({
    checkJwt: mockCheckJwt,
}));

describe('reportRoutes', () => {
    let app;

    beforeEach(async () => {
        jest.clearAllMocks();
        app = express();
        app.use(express.json());

        const reportRoutes = await import('../../routes/reportRoutes.js');
        app.use('/api/reports', reportRoutes.default);
    });

    it('should create report config', async () => {
        const response = await request(app).post('/api/reports/config');
        expect(response.status).toBe(200);
        expect(mockCreateReportConfig).toHaveBeenCalled();
    });

    it('should get report configs', async () => {
        const response = await request(app).get('/api/reports/config');
        expect(response.status).toBe(200);
        expect(mockGetReportConfigs).toHaveBeenCalled();
    });

    it('should get report config by ID', async () => {
        const response = await request(app).get('/api/reports/config/config123');
        expect(response.status).toBe(200);
        expect(mockGetReportConfigById).toHaveBeenCalled();
    });

    it('should update report config', async () => {
        const response = await request(app).put('/api/reports/config/config123');
        expect(response.status).toBe(200);
        expect(mockUpdateReportConfig).toHaveBeenCalled();
    });

    it('should delete report config', async () => {
        const response = await request(app).delete('/api/reports/config/config123');
        expect(response.status).toBe(200);
        expect(mockDeleteReportConfig).toHaveBeenCalled();
    });

    it('should generate report', async () => {
        const response = await request(app).post('/api/reports/generate');
        expect(response.status).toBe(200);
        expect(mockGenerateReport).toHaveBeenCalled();
    });

    it('should export report as PDF', async () => {
        const response = await request(app).post('/api/reports/report123/export/pdf');
        expect(response.status).toBe(200);
        expect(mockExportReportPDF).toHaveBeenCalled();
    });

    it('should export report as Excel', async () => {
        const response = await request(app).post('/api/reports/report123/export/excel');
        expect(response.status).toBe(200);
        expect(mockExportReportExcel).toHaveBeenCalled();
    });

    it('should share report', async () => {
        const response = await request(app).post('/api/reports/report123/share');
        expect(response.status).toBe(200);
        expect(mockShareReport).toHaveBeenCalled();
    });

    it('should get user shared reports', async () => {
        const response = await request(app).get('/api/reports/shared');
        expect(response.status).toBe(200);
        expect(mockGetUserSharedReports).toHaveBeenCalled();
    });

    it('should revoke shared report', async () => {
        const response = await request(app).delete('/api/reports/shared/shared123');
        expect(response.status).toBe(200);
        expect(mockRevokeSharedReport).toHaveBeenCalled();
    });

    it('should protect routes with checkJwt', async () => {
        await request(app).get('/api/reports/config');
        expect(mockCheckJwt).toHaveBeenCalled();
    });
});
