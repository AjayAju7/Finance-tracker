import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  MenuItem,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  IconButton,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Warning as WarningIcon,
  TrendingUp,
} from '@mui/icons-material';
import api from '../services/api';

const CATEGORIES = [
  'Food',
  'Travel',
  'Rent',
  'Utilities',
  'Entertainment',
  'Shopping',
  'Investments',
  'Medical',
  'Education',
  'Others'
];

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

function Budgets() {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  // Form state
  const [formCategory, setFormCategory] = useState('Food');
  const [formLimit, setFormLimit] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [submitLoading, setSubmitLoading] = useState(false);

  // Delete State
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState(null);

  // Fetch budgets from API
  const fetchBudgets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/budgets?month=${month}&year=${year}`);
      setBudgets(res.data);
    } catch (err) {
      console.error('Error fetching budgets', err);
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  const validateForm = () => {
    const errors = {};
    if (!formLimit || isNaN(formLimit) || parseFloat(formLimit) <= 0) {
      errors.limit = 'Please enter a valid positive amount.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveBudget = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitLoading(true);
    setFormErrors({});

    const data = {
      category: formCategory,
      monthly_limit: parseFloat(formLimit).toFixed(2),
      month: month,
      year: year,
    };

    try {
      // Backend validates uniqueness, let's post
      await api.post('/budgets', data);
      setFormLimit('');
      fetchBudgets();
    } catch (err) {
      console.error('Error saving budget', err);
      if (err.response?.data?.detail) {
        setFormErrors({ api: err.response.data.detail });
      } else {
        setFormErrors({ api: 'Failed to set budget. Note: A budget for this category might already exist.' });
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleOpenDelete = (budget) => {
    setSelectedBudget(budget);
    setOpenDeleteDialog(true);
  };

  const handleCloseDelete = () => {
    setSelectedBudget(null);
    setOpenDeleteDialog(false);
  };

  const handleDeleteBudget = async () => {
    if (!selectedBudget) return;
    setSubmitLoading(true);
    try {
      await api.delete(`/budgets/${selectedBudget.id}`);
      handleCloseDelete();
      fetchBudgets();
    } catch (err) {
      console.error('Error deleting budget', err);
    } finally {
      setSubmitLoading(false);
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
            Budget Planner
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Set limit caps per expense category and monitor real-time utilization.
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

      <Grid container spacing={4}>
        {/* Create/Set Budget Card */}
        <Grid item xs={12} md={4}>
          <Paper className="glass-card-no-hover" sx={{ p: 4 }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
              Establish Budget Limit
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Enter a spending limit cap for the selected period ({MONTHS.find(m => m.value === month)?.label} {year}).
            </Typography>

            {formErrors.api && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>
                {formErrors.api}
              </Alert>
            )}

            <form onSubmit={handleSaveBudget}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
                <TextField
                  select
                  fullWidth
                  label="Category Name"
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                >
                  {CATEGORIES.map((cat) => (
                    <MenuItem key={cat} value={cat}>
                      {cat}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  required
                  fullWidth
                  label="Monthly Limit Cap"
                  type="number"
                  value={formLimit}
                  onChange={(e) => setFormLimit(e.target.value)}
                  error={!!formErrors.limit}
                  helperText={formErrors.limit}
                  InputProps={{
                    startAdornment: <Typography sx={{ mr: 1, color: 'text.secondary', fontWeight: 600 }}>₹</Typography>,
                  }}
                />
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={submitLoading}
                  startIcon={<AddIcon />}
                  sx={{ py: 1.5, mt: 1 }}
                >
                  {submitLoading ? <CircularProgress size={24} color="inherit" /> : 'Set Limit'}
                </Button>
              </Box>
            </form>
          </Paper>
        </Grid>

        {/* Budgets List Grid */}
        <Grid item xs={12} md={8}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
              <CircularProgress />
            </Box>
          ) : budgets.length === 0 ? (
            <Paper
              className="glass-card-no-hover"
              sx={{
                p: 8,
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                boxSizing: 'border-box'
              }}
            >
              <Box
                sx={{
                  bgcolor: 'rgba(99, 102, 241, 0.05)',
                  p: 2,
                  borderRadius: '50%',
                  mb: 2,
                  border: '1px solid rgba(99, 102, 241, 0.1)',
                }}
              >
                <TrendingUp color="primary" sx={{ fontSize: 40 }} />
              </Box>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Budgets Outlined
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 350 }}>
                Set category budgets on the left panel to control your monthly spending limit.
              </Typography>
            </Paper>
          ) : (
            <Grid container spacing={3.5}>
              {budgets.map((b) => {
                const spent = b.spent || 0;
                const limit = parseFloat(b.monthly_limit);
                const percent = limit > 0 ? (spent / limit) * 100 : 0;
                const remaining = limit - spent;
                
                let progressColor = 'success';
                let alertText = 'Safe';
                let alertIcon = null;

                if (percent >= 100) {
                  progressColor = 'error';
                  alertText = 'Exceeded';
                  alertIcon = <WarningIcon sx={{ fontSize: 14 }} />;
                } else if (percent >= 80) {
                  progressColor = 'warning';
                  alertText = 'Warning';
                  alertIcon = <WarningIcon sx={{ fontSize: 14 }} />;
                }

                return (
                  <Grid item xs={12} sm={6} key={b.id}>
                    <Card className="glass-panel">
                      <CardContent sx={{ p: 3 }}>
                        {/* Title and Action */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2.5 }}>
                          <Box>
                            <Typography variant="h6" fontWeight={700}>
                              {b.category}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Period: {MONTHS.find(m => m.value === month)?.label} {year}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip
                              label={alertText}
                              size="small"
                              color={progressColor}
                              icon={alertIcon}
                              sx={{ height: 20, fontSize: 10, fontWeight: 800 }}
                            />
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleOpenDelete(b)}
                              sx={{ bgcolor: 'rgba(244,63,94,0.05)', '&:hover': { bgcolor: 'rgba(244,63,94,0.15)' } }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </Box>

                        {/* Utilization Bar */}
                        <Box sx={{ mb: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="body2" color="text.secondary" fontWeight={500}>
                              Utilization Rate
                            </Typography>
                            <Typography variant="body2" fontWeight={700} className="tabular-nums" color={progressColor + '.main'}>
                              {Math.round(percent)}%
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={Math.min(percent, 100)}
                            color={progressColor}
                            sx={{ height: 8, borderRadius: 4, bgcolor: 'rgba(255,255,255,0.05)' }}
                          />
                        </Box>

                        {/* Summary Details */}
                        <Grid container spacing={1} sx={{ mt: 1, borderTop: '1px solid rgba(255,255,255,0.05)', pt: 1.5 }}>
                          <Grid item xs={4}>
                            <Typography variant="caption" color="text.secondary" display="block">
                              Spent
                            </Typography>
                            <Typography variant="body2" fontWeight={700} className="tabular-nums">
                              {formatCurrency(spent)}
                            </Typography>
                          </Grid>
                          <Grid item xs={4} sx={{ borderLeft: '1px solid rgba(255,255,255,0.05)', pl: 1.5 }}>
                            <Typography variant="caption" color="text.secondary" display="block">
                              Limit
                            </Typography>
                            <Typography variant="body2" fontWeight={700} className="tabular-nums">
                              {formatCurrency(limit)}
                            </Typography>
                          </Grid>
                          <Grid item xs={4} sx={{ borderLeft: '1px solid rgba(255,255,255,0.05)', pl: 1.5 }}>
                            <Typography variant="caption" color="text.secondary" display="block">
                              Remaining
                            </Typography>
                            <Typography
                              variant="body2"
                              fontWeight={700}
                              className="tabular-nums"
                              color={remaining < 0 ? 'error.main' : 'success.main'}
                            >
                              {formatCurrency(remaining)}
                            </Typography>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </Grid>
      </Grid>

      {/* Delete Confirmation Modal */}
      <Dialog open={openDeleteDialog} onClose={handleCloseDelete}>
        <DialogTitle fontWeight={700}>Remove Budget Limit</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to remove the budget limit for category{' '}
            <strong>{selectedBudget?.category}</strong> in {MONTHS.find(m => m.value === month)?.label}{' '}
            {year}?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleCloseDelete} color="inherit" disabled={submitLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteBudget}
            color="error"
            variant="contained"
            disabled={submitLoading}
            sx={{ py: 1, px: 2.5 }}
          >
            {submitLoading ? <CircularProgress size={20} color="inherit" /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default Budgets;
