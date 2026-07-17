import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  MenuItem,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
} from '@mui/material';
import {
  PictureAsPdf as PdfIcon,
  TableChart as CsvIcon,
  Description as ExcelIcon,
  Assessment as ReportIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import api from '../services/api';

const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - i);

function Reports() {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(null); // 'pdf' | 'csv' | 'excel' | null
  const [error, setError] = useState('');

  // Fetch report summary
  const fetchReportSummary = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/reports/summary?month=${month}&year=${year}`);
      setSummaryData(res.data);
    } catch (err) {
      console.error('Error fetching report summary', err);
      setError('Failed to fetch report summary for the selected period.');
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    fetchReportSummary();
  }, [fetchReportSummary]);

  // Handle file downloads securely using Blob API
  const handleExport = async (format) => {
    setExportLoading(format);
    try {
      const res = await api.get('/reports/export', {
        params: { format, month, year },
        responseType: 'blob',
      });

      // Create blob link in browser memory
      const blob = new Blob([res.data], { type: res.headers['content-type'] });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const ext = format === 'excel' ? 'xlsx' : format;
      link.setAttribute('download', `Finance_Report_${year}_${month}.${ext}`);
      
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed', err);
      alert('Failed to export report. Please try again.');
    } finally {
      setExportLoading(null);
    }
  };

  // Currency Formatter
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }} className="animate-fade-in">
      {/* Header section */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-0.025em' }}>
            Financial Reports
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Generate and export structured reports of your cash flow.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, minWidth: 260 }}>
          <TextField
            select
            size="small"
            label="Month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            sx={{ width: 130 }}
          >
            {MONTHS.map((m) => (
              <MenuItem key={m.value} value={m.value}>
                {m.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            size="small"
            label="Year"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            sx={{ width: 110 }}
          >
            {YEARS.map((y) => (
              <MenuItem key={y} value={y}>
                {y}
              </MenuItem>
            ))}
          </TextField>
        </Box>
      </Box>

      {/* Export Action Card */}
      <Paper className="glass-card-no-hover" sx={{ p: 4, mb: 4 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={5}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Box
                sx={{
                  bgcolor: 'rgba(99, 102, 241, 0.1)',
                  p: 1.5,
                  borderRadius: 3,
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                  display: 'flex',
                }}
              >
                <ReportIcon color="primary" sx={{ fontSize: 32 }} />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  Download Document
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Export financial sheets for {MONTHS.find(m => m.value === month)?.label} {year}.
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} md={7}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: { md: 'flex-end' } }}>
              <Button
                variant="outlined"
                color="error"
                size="large"
                startIcon={exportLoading === 'pdf' ? <CircularProgress size={20} color="inherit" /> : <PdfIcon />}
                onClick={() => handleExport('pdf')}
                disabled={!!exportLoading || loading}
                sx={{ borderRadius: 3, height: 50, border: '1px solid rgba(244,63,94,0.3)', '&:hover': { border: '1px solid rgba(244,63,94,0.6)' } }}
              >
                Export PDF
              </Button>
              <Button
                variant="outlined"
                color="info"
                size="large"
                startIcon={exportLoading === 'csv' ? <CircularProgress size={20} color="inherit" /> : <CsvIcon />}
                onClick={() => handleExport('csv')}
                disabled={!!exportLoading || loading}
                sx={{ borderRadius: 3, height: 50, border: '1px solid rgba(59,130,246,0.3)', '&:hover': { border: '1px solid rgba(59,130,246,0.6)' } }}
              >
                Export CSV
              </Button>
              <Button
                variant="outlined"
                color="success"
                size="large"
                startIcon={exportLoading === 'excel' ? <CircularProgress size={20} color="inherit" /> : <ExcelIcon />}
                onClick={() => handleExport('excel')}
                disabled={!!exportLoading || loading}
                sx={{ borderRadius: 3, height: 50, border: '1px solid rgba(16,185,129,0.3)', '&:hover': { border: '1px solid rgba(16,185,129,0.6)' } }}
              >
                Export Excel
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Report Summary Details Preview */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ borderRadius: 3 }}>
          {error}
        </Alert>
      ) : summaryData ? (
        <Grid container spacing={4}>
          {/* Summary Cards */}
          <Grid item xs={12} md={4}>
            <Grid container spacing={3.5}>
              <Grid item xs={12}>
                <Card className="glass-panel">
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="body2" color="text.secondary" fontWeight={600} gutterBottom>
                      MONTHLY REVENUE
                    </Typography>
                    <Typography variant="h4" fontWeight={800} className="tabular-nums text-gradient-success" sx={{ mb: 1 }}>
                      {formatCurrency(summaryData.total_income)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Inflow from salary & investments.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12}>
                <Card className="glass-panel">
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="body2" color="text.secondary" fontWeight={600} gutterBottom>
                      MONTHLY SPENDING
                    </Typography>
                    <Typography variant="h4" fontWeight={800} className="tabular-nums text-gradient-danger" sx={{ mb: 1 }}>
                      {formatCurrency(summaryData.total_expense)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Outflow for utilities & living.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12}>
                <Card className="glass-panel">
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="body2" color="text.secondary" fontWeight={600} gutterBottom>
                      NET NET SAVINGS
                    </Typography>
                    <Typography variant="h4" fontWeight={800} className="tabular-nums text-gradient-primary" sx={{ mb: 1 }}>
                      {formatCurrency(summaryData.net_savings)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Accumulated capital reserves.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Grid>

          {/* Breakdown Tables preview */}
          <Grid item xs={12} md={8}>
            <Paper className="glass-card-no-hover" sx={{ p: 4, height: '100%', boxSizing: 'border-box' }}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 3 }}>
                Category Audit Summary
              </Typography>
              
              {summaryData.category_breakdown.length === 0 ? (
                <Box sx={{ py: 6, textAlign: 'center' }}>
                  <Typography variant="body1" color="text.secondary">
                    No transactions recorded this month.
                  </Typography>
                </Box>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Expense Category</TableCell>
                        <TableCell align="right">Amount Spent</TableCell>
                        <TableCell align="right">Percentage of Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {summaryData.category_breakdown.map((item) => {
                        const percent = summaryData.total_expense > 0 ? (item.spent / summaryData.total_expense) * 100 : 0;
                        return (
                          <TableRow key={item.category} hover>
                            <TableCell sx={{ fontWeight: 600, py: 2 }}>{item.category}</TableCell>
                            <TableCell align="right" className="tabular-nums" sx={{ fontWeight: 700 }}>
                              {formatCurrency(item.spent)}
                            </TableCell>
                            <TableCell align="right" className="tabular-nums" color="text.secondary">
                              {percent.toFixed(1)}%
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Paper>
          </Grid>
        </Grid>
      ) : null}
    </Container>
  );
}

export default Reports;
