import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";

const BILLING_TYPES = {
    hourly: { label: "Hourly Rate", icon: "⏱️" },
    package: { label: "Package Deal", icon: "📦" },
    retainer: { label: "Monthly Retainer", icon: "📅" },
};

const PAYMENT_STATUS = {
    pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800" },
    completed: { label: "Completed", color: "bg-green-100 text-green-800" },
    failed: { label: "Failed", color: "bg-red-100 text-red-800" },
    refunded: { label: "Refunded", color: "bg-gray-100 text-gray-800" },
};

export default function AdvisorBillingPanel({ relationship, isAdvisor }) {
    const [activeTab, setActiveTab] = useState("payments");
    const [billingAgreement, setBillingAgreement] = useState(null);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    const [invoices, setInvoices] = useState([]);

    // Payment form state
    const [paymentForm, setPaymentForm] = useState({
        amount: "",
        description: "",
        sessionId: "",
    });

    // Invoice form state
    const [invoiceForm, setInvoiceForm] = useState({
        amount: "",
        description: "",
        dueDate: "",
    });

    useEffect(() => {
        fetchBillingData();
    }, [relationship]);

    const fetchBillingData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            // Fetch billing agreement
            const billingRes = await fetch(`/api/external-advisors/billing/${relationship._id}`, { headers });
            if (billingRes.ok) {
                const billingData = await billingRes.json();
                setBillingAgreement(billingData.billing);
            }

            // Fetch payment history
            const paymentsRes = await fetch(`/api/external-advisors/payments/${relationship._id}`, { headers });
            if (paymentsRes.ok) {
                const paymentsData = await paymentsRes.json();
                setPayments(paymentsData.payments || []);
            }
        } catch (err) {
            setError("Failed to load billing data: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const [paymentSuccess, setPaymentSuccess] = useState("");

    const handleRecordPayment = async (e) => {
        e.preventDefault();
        setError("");

        if (!paymentForm.amount || parseFloat(paymentForm.amount) <= 0) {
            setError("Please enter a valid amount");
            return;
        }

        try {
            const token = localStorage.getItem("token");
            const headers = {
                "Content-Type": "application/json",
                ...(token && { Authorization: `Bearer ${token}` }),
            };

            const response = await fetch("/api/external-advisors/payments", {
                method: "POST",
                headers,
                body: JSON.stringify({
                    relationshipId: relationship._id,
                    amount: parseFloat(paymentForm.amount),
                    description: paymentForm.description || "Payment",
                    sessionId: paymentForm.sessionId || undefined,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setShowPaymentModal(false);
                setPaymentForm({ amount: "", description: "", sessionId: "" });
                setPaymentSuccess(`Payment of $${paymentForm.amount} recorded successfully!`);
                setTimeout(() => setPaymentSuccess(""), 5000);
                fetchBillingData();
            } else {
                setError(data.message || "Failed to record payment");
            }
        } catch (err) {
            setError("Failed to record payment: " + err.message);
        }
    };

    const [invoiceSuccess, setInvoiceSuccess] = useState("");

    const handleGenerateInvoice = async (e) => {
        e.preventDefault();
        setError("");

        if (!invoiceForm.amount || parseFloat(invoiceForm.amount) <= 0) {
            setError("Please enter a valid amount");
            return;
        }

        // Generate a simple invoice locally (can be enhanced with backend later)
        const newInvoice = {
            _id: Date.now().toString(),
            invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
            amount: parseFloat(invoiceForm.amount),
            description: invoiceForm.description || "Advisory Services",
            dueDate: invoiceForm.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            createdAt: new Date().toISOString(),
            status: "pending",
            relationshipId: relationship._id,
        };

        setInvoices([newInvoice, ...invoices]);
        setShowInvoiceModal(false);
        setInvoiceForm({ amount: "", description: "", dueDate: "" });
        setInvoiceSuccess(`Invoice #${newInvoice.invoiceNumber} generated successfully!`);
        setTimeout(() => setInvoiceSuccess(""), 5000);
        setActiveTab("invoices");
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
        }).format(amount);
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "N/A";
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    const calculateTotalPaid = () => {
        return payments
            .filter((p) => p.status === "completed")
            .reduce((sum, p) => sum + p.amount, 0);
    };

    const calculatePendingPayments = () => {
        return payments
            .filter((p) => p.status === "pending")
            .reduce((sum, p) => sum + p.amount, 0);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    // Determine party names with proper fallbacks
    const advisorDisplayName = relationship.advisorName
        || (relationship.advisorId?.firstName && relationship.advisorId?.lastName
            ? `${relationship.advisorId.firstName} ${relationship.advisorId.lastName}`
            : null)
        || relationship.advisorEmail
        || "Advisor";

    const clientDisplayName = relationship.senderName
        || (relationship.userId?.firstName && relationship.userId?.lastName
            ? `${relationship.userId.firstName} ${relationship.userId.lastName}`
            : null)
        || relationship.senderEmail
        || "Client";

    const otherPartyName = isAdvisor ? clientDisplayName : advisorDisplayName;

    return (
        <div className="bg-white rounded-xl shadow-sm border">
            {/* Header */}
            <div className="border-b px-6 py-4">
                <h2 className="text-xl font-bold text-gray-900">Billing & Payments</h2>
                <p className="text-sm text-gray-500">
                    {isAdvisor ? `Client: ${otherPartyName}` : `Advisor: ${otherPartyName}`}
                </p>
            </div>

            {error && (
                <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                    {error}
                    <button onClick={() => setError("")} className="ml-2 text-red-500 hover:text-red-700">✕</button>
                </div>
            )}

            {paymentSuccess && (
                <div className="mx-6 mt-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
                    ✅ {paymentSuccess}
                    <button onClick={() => setPaymentSuccess("")} className="ml-2 text-green-500 hover:text-green-700">✕</button>
                </div>
            )}

            {/* Tabs */}
            <div className="border-b px-6">
                <div className="flex space-x-6">
                    {["overview", "payments", "invoices"].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`py-4 border-b-2 font-medium text-sm transition-colors ${activeTab === tab
                                    ? "border-indigo-500 text-indigo-600"
                                    : "border-transparent text-gray-500 hover:text-gray-700"
                                }`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            <div className="p-6">
                {/* Overview Tab */}
                {activeTab === "overview" && (
                    <div className="space-y-6">
                        {/* Billing Agreement Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-indigo-50 rounded-lg p-4">
                                <p className="text-sm text-indigo-600 font-medium">Billing Type</p>
                                <p className="text-2xl font-bold text-indigo-900 mt-1">
                                    {billingAgreement?.billingType
                                        ? BILLING_TYPES[billingAgreement.billingType]?.label || "Hourly Rate"
                                        : "Hourly Rate"}
                                </p>
                            </div>

                            <div className="bg-green-50 rounded-lg p-4">
                                <p className="text-sm text-green-600 font-medium">Total Paid</p>
                                <p className="text-2xl font-bold text-green-900 mt-1">
                                    {formatCurrency(calculateTotalPaid())}
                                </p>
                            </div>

                            <div className="bg-yellow-50 rounded-lg p-4">
                                <p className="text-sm text-yellow-600 font-medium">Pending</p>
                                <p className="text-2xl font-bold text-yellow-900 mt-1">
                                    {formatCurrency(calculatePendingPayments())}
                                </p>
                            </div>
                        </div>

                        {/* Rate Information */}
                        {billingAgreement && (
                            <div className="bg-gray-50 rounded-lg p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Rate Details</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    {billingAgreement.billingType === "hourly" && (
                                        <>
                                            <div>
                                                <span className="text-gray-600">Hourly Rate:</span>
                                                <span className="ml-2 font-medium">
                                                    {formatCurrency(billingAgreement.hourlyRate)}/hr
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Minimum Hours:</span>
                                                <span className="ml-2 font-medium">
                                                    {billingAgreement.minimumHours || 1} hour(s)
                                                </span>
                                            </div>
                                        </>
                                    )}

                                    {billingAgreement.billingType === "package" && (
                                        <>
                                            <div>
                                                <span className="text-gray-600">Package Price:</span>
                                                <span className="ml-2 font-medium">
                                                    {formatCurrency(billingAgreement.packagePrice)}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Included Sessions:</span>
                                                <span className="ml-2 font-medium">
                                                    {billingAgreement.packageSessions || "Unlimited"}
                                                </span>
                                            </div>
                                        </>
                                    )}

                                    {billingAgreement.billingType === "retainer" && (
                                        <>
                                            <div>
                                                <span className="text-gray-600">Monthly Fee:</span>
                                                <span className="ml-2 font-medium">
                                                    {formatCurrency(billingAgreement.retainerFee)}/month
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Included Hours:</span>
                                                <span className="ml-2 font-medium">
                                                    {billingAgreement.retainerHours || "Unlimited"} hrs/month
                                                </span>
                                            </div>
                                        </>
                                    )}

                                    <div>
                                        <span className="text-gray-600">Payment Method:</span>
                                        <span className="ml-2 font-medium capitalize">
                                            {typeof billingAgreement.paymentMethod === "object"
                                                ? `${billingAgreement.paymentMethod.brand || ""} ****${billingAgreement.paymentMethod.last4 || ""}`.trim() || "Card on file"
                                                : billingAgreement.paymentMethod || "Not specified"}
                                        </span>
                                    </div>

                                    <div>
                                        <span className="text-gray-600">Status:</span>
                                        <span
                                            className={`ml-2 px-2 py-1 rounded text-xs font-medium ${billingAgreement.isActive
                                                    ? "bg-green-100 text-green-800"
                                                    : "bg-gray-100 text-gray-800"
                                                }`}
                                        >
                                            {billingAgreement.isActive ? "Active" : "Inactive"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Quick Actions */}
                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={() => { setActiveTab("payments"); setShowPaymentModal(true); }}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                            >
                                💵 Record Payment
                            </button>
                            <button
                                onClick={() => setShowInvoiceModal(true)}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                📄 Generate Invoice
                            </button>
                        </div>
                    </div>
                )}

                {/* Payments Tab */}
                {activeTab === "payments" && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-gray-900">Payment History</h3>
                            <button
                                onClick={() => setShowPaymentModal(true)}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
                            >
                                + Record Payment
                            </button>
                        </div>

                        {payments.length === 0 ? (
                            <div className="text-center py-12 bg-gray-50 rounded-lg">
                                <p className="text-gray-500 text-4xl mb-3">💵</p>
                                <p className="text-gray-600">No payments recorded yet</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="text-left text-sm text-gray-500 border-b">
                                            <th className="pb-3 font-medium">Date</th>
                                            <th className="pb-3 font-medium">Description</th>
                                            <th className="pb-3 font-medium">Amount</th>
                                            <th className="pb-3 font-medium">Status</th>
                                            <th className="pb-3 font-medium">Receipt</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {payments.map((payment) => (
                                            <tr key={payment._id} className="border-b last:border-0">
                                                <td className="py-4 text-gray-900">
                                                    {formatDate(payment.paymentDate || payment.createdAt)}
                                                </td>
                                                <td className="py-4 text-gray-600">
                                                    {payment.description || "Payment"}
                                                </td>
                                                <td className="py-4 font-medium text-gray-900">
                                                    {formatCurrency(payment.amount)}
                                                </td>
                                                <td className="py-4">
                                                    <span
                                                        className={`px-2 py-1 rounded text-xs font-medium ${PAYMENT_STATUS[payment.status]?.color || "bg-gray-100"
                                                            }`}
                                                    >
                                                        {PAYMENT_STATUS[payment.status]?.label || payment.status}
                                                    </span>
                                                </td>
                                                <td className="py-4">
                                                    {payment.receiptUrl ? (
                                                        <a
                                                            href={payment.receiptUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-indigo-600 hover:text-indigo-800 text-sm"
                                                        >
                                                            View
                                                        </a>
                                                    ) : (
                                                        <span className="text-gray-400 text-sm">—</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* Invoices Tab */}
                {activeTab === "invoices" && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-gray-900">Invoices</h3>
                            <button
                                onClick={() => setShowInvoiceModal(true)}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
                            >
                                + Generate Invoice
                            </button>
                        </div>

                        {invoiceSuccess && (
                            <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
                                ✅ {invoiceSuccess}
                                <button onClick={() => setInvoiceSuccess("")} className="ml-2 text-green-500 hover:text-green-700">✕</button>
                            </div>
                        )}

                        {invoices.length === 0 ? (
                            <div className="text-center py-12 bg-gray-50 rounded-lg">
                                <p className="text-gray-500 text-4xl mb-3">📋</p>
                                <p className="text-gray-600">No invoices generated yet</p>
                                <p className="text-sm text-gray-400 mt-2">
                                    Click "Generate Invoice" to create your first invoice
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="text-left text-sm text-gray-500 border-b">
                                            <th className="pb-3 font-medium">Invoice #</th>
                                            <th className="pb-3 font-medium">Description</th>
                                            <th className="pb-3 font-medium">Amount</th>
                                            <th className="pb-3 font-medium">Due Date</th>
                                            <th className="pb-3 font-medium">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {invoices.map((invoice) => (
                                            <tr key={invoice._id} className="border-b last:border-0">
                                                <td className="py-4 text-gray-900 font-medium">
                                                    {invoice.invoiceNumber}
                                                </td>
                                                <td className="py-4 text-gray-600">
                                                    {invoice.description || "Advisory Services"}
                                                </td>
                                                <td className="py-4 font-medium text-gray-900">
                                                    {formatCurrency(invoice.amount)}
                                                </td>
                                                <td className="py-4 text-gray-600">
                                                    {formatDate(invoice.dueDate)}
                                                </td>
                                                <td className="py-4">
                                                    <span className={`px-2 py-1 rounded text-xs font-medium ${invoice.status === "paid"
                                                            ? "bg-green-100 text-green-800"
                                                            : "bg-yellow-100 text-yellow-800"
                                                        }`}>
                                                        {invoice.status === "paid" ? "Paid" : "Pending"}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Payment Modal */}
            {showPaymentModal && (
                <div
                    className="fixed inset-0 flex items-center justify-center z-50"
                    style={{ backgroundColor: "rgba(0,0,0,0.48)" }}
                >
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-gray-900">Record Payment</h3>
                            <button
                                onClick={() => setShowPaymentModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleRecordPayment} className="space-y-4">
                            <div>
                                <label className="block text-gray-700 font-medium mb-2">
                                    Amount <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                                        $
                                    </span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={paymentForm.amount}
                                        onChange={(e) =>
                                            setPaymentForm({ ...paymentForm, amount: e.target.value })
                                        }
                                        placeholder="0.00"
                                        required
                                        className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-gray-700 font-medium mb-2">
                                    Description
                                </label>
                                <input
                                    type="text"
                                    value={paymentForm.description}
                                    onChange={(e) =>
                                        setPaymentForm({ ...paymentForm, description: e.target.value })
                                    }
                                    placeholder="e.g., Session payment, Monthly retainer..."
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowPaymentModal(false)}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                                >
                                    Record Payment
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Invoice Modal */}
            {showInvoiceModal && (
                <div
                    className="fixed inset-0 flex items-center justify-center z-50"
                    style={{ backgroundColor: "rgba(0,0,0,0.48)" }}
                >
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-gray-900">Generate Invoice</h3>
                            <button
                                onClick={() => setShowInvoiceModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleGenerateInvoice} className="space-y-4">
                            <div>
                                <label className="block text-gray-700 font-medium mb-2">
                                    Amount <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                                        $
                                    </span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={invoiceForm.amount}
                                        onChange={(e) =>
                                            setInvoiceForm({ ...invoiceForm, amount: e.target.value })
                                        }
                                        placeholder="0.00"
                                        required
                                        className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-gray-700 font-medium mb-2">
                                    Description
                                </label>
                                <input
                                    type="text"
                                    value={invoiceForm.description}
                                    onChange={(e) =>
                                        setInvoiceForm({ ...invoiceForm, description: e.target.value })
                                    }
                                    placeholder="e.g., Career coaching session, Resume review..."
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="block text-gray-700 font-medium mb-2">
                                    Due Date
                                </label>
                                <input
                                    type="date"
                                    value={invoiceForm.dueDate}
                                    onChange={(e) =>
                                        setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })
                                    }
                                    min={new Date().toISOString().split('T')[0]}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowInvoiceModal(false)}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                                >
                                    Generate Invoice
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

AdvisorBillingPanel.propTypes = {
    relationship: PropTypes.object.isRequired,
    isAdvisor: PropTypes.bool,
};

AdvisorBillingPanel.defaultProps = {
    isAdvisor: false,
};
