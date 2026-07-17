import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Grid,
  Chip,
  InputAdornment,
  CircularProgress,
  DialogContentText,
  Autocomplete,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import api from '../services/api';

const CATEGORIES = [
  'Food',
  'Travel',
  'Rent',
  'Utilities',
  'Entertainment',
  'Salary',
  'Shopping',
  'Investments',
  'Medical',
  'Education',
  'Others'
];

function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Filters
  const [typeFilter, setTypeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Dialogs
  const [openAddEditDialog, setOpenAddEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedTx, setSelectedTx] = useState(null); // Non-null when editing or deleting

  // Form State
  const [formAmount, setFormAmount] = useState('');
  const [formCategory, setFormCategory] = useState('Food');
  const [formType, setFormType] = useState('Expense');
  const [formDescription, setFormDescription] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formErrors, setFormErrors] = useState({});
  const [submitLoading, setSubmitLoading] = useState(false);

  // Fetch transactions from API
  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      // Build query string
      let queryParams = [];
      if (typeFilter) queryParams.push(`transaction_type=${typeFilter}`);
      if (categoryFilter) queryParams.push(`category=${categoryFilter}`);
      if (startDate) queryParams.push(`start_date=${startDate}`);
      if (endDate) queryParams.push(`end_date=${endDate}`);

      const res = await api.get(`/transactions?${queryParams.join('&')}`);
      
      // Perform client-side filter for description search
      let filteredData = res.data;
      if (searchQuery) {
        filteredData = res.data.filter(tx =>
          tx.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tx.category.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      setTransactions(filteredData);
    } catch (err) {
      console.error('Error fetching transactions', err);
    } finally {
      setLoading(false);
    }
  }, [typeFilter, categoryFilter, startDate, endDate, searchQuery]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenAdd = () => {
    setSelectedTx(null);
    setFormAmount('');
    setFormCategory('Food');
    setFormType('Expense');
    setFormDescription('');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormErrors({});
    setOpenAddEditDialog(true);
  };

  const handleOpenEdit = (tx) => {
    setSelectedTx(tx);
    setFormAmount(tx.amount);
    setFormCategory(tx.category);
    setFormType(tx.transaction_type);
    setFormDescription(tx.description);
    setFormDate(tx.date);
    setFormErrors({});
    setOpenAddEditDialog(true);
  };

  const handleOpenDelete = (tx) => {
    setSelectedTx(tx);
    setOpenDeleteDialog(true);
  };

  const handleCloseDialogs = () => {
    setOpenAddEditDialog(false);
    setOpenDeleteDialog(false);
    setSelectedTx(null);
  };

  const validateForm = () => {
    const errors = {};
    if (!formAmount || isNaN(formAmount) || parseFloat(formAmount) <= 0) {
      errors.amount = 'Please enter a valid positive amount.';
    }
    if (!formCategory) {
      errors.category = 'Please select or enter a category.';
    }
    if (!formDate) {
      errors.date = 'Please select a date.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitLoading(true);
    const data = {
      amount: parseFloat(formAmount).toFixed(2),
      category: formCategory,
      transaction_type: formType,
      description: formDescription,
      date: formDate,
    };

    try {
      if (selectedTx) {
        // Edit mode
        await api.put(`/transactions/${selectedTx.id}`, data);
      } else {
        // Add mode
        await api.post('/transactions', data);
      }
      handleCloseDialogs();
      fetchTransactions();
    } catch (err) {
      console.error('Error saving transaction', err);
      setFormErrors({ api: 'Failed to save transaction. Please check details.' });
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedTx) return;
    setSubmitLoading(true);
    try {
      await api.delete(`/transactions/${selectedTx.id}`);
      handleCloseDialogs();
      fetchTransactions();
    } catch (err) {
      console.error('Error deleting transaction', err);
    } finally {
      setSubmitLoading(false);
    }
  };

  const clearFilters = () => {
    setTypeFilter('');
    setCategoryFilter('');
    setStartDate('');
    setEndDate('');
    setSearchQuery('');
  };

  // Currency formatter
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(value);
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }} className="animate-fade-in">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-0.025em' }}>
            Transactions Ledger
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your daily transactions and audit historic logs.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenAdd}
          sx={{ height: 46, borderRadius: 3 }}
        >
          Add Transaction
        </Button>
      </Box>

      {/* Filter Options Panel */}
      <Paper className="glass-card-no-hover" sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4} md={2.5}>
            <TextField
              fullWidth
              size="small"
              label="Search Description"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={6} sm={4} md={1.5}>
            <TextField
              select
              fullWidth
              size="small"
              label="Type"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <MenuItem value="">All Types</MenuItem>
              <MenuItem value="Income">Income</MenuItem>
              <MenuItem value="Expense">Expense</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <TextField
              select
              fullWidth
              size="small"
              label="Category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <MenuItem value="">All Categories</MenuItem>
              {CATEGORIES.map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {cat}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="Start Date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="End Date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={4} md={2} sx={{ display: 'flex', gap: 1 }}>
            <Button
              fullWidth
              variant="outlined"
              color="inherit"
              startIcon={<ClearIcon />}
              onClick={clearFilters}
              sx={{ height: 40, border: '1px solid rgba(255,255,255,0.08)' }}
            >
              Clear
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Transactions Data Table */}
      <TableContainer component={Paper} className="glass-card-no-hover">
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : transactions.length === 0 ? (
          <Box sx={{ py: 8, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Transactions Found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Try modifying your filter settings or log a new transaction.
            </Typography>
          </Box>
        ) : (
          <>
            <Table sx={{ minWidth: 650 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((tx) => (
                    <TableRow key={tx.id} hover>
                      <TableCell className="tabular-nums">
                        {new Date(tx.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{tx.category}</TableCell>
                      <TableCell color="text.secondary">{tx.description || '-'}</TableCell>
                      <TableCell>
                        <Chip
                          label={tx.transaction_type}
                          size="small"
                          color={tx.transaction_type === 'Income' ? 'success' : 'error'}
                          variant="outlined"
                          sx={{ height: 22, fontSize: 11, fontWeight: 700 }}
                        />
                      </TableCell>
                      <TableCell
                        align="right"
                        className="tabular-nums"
                        sx={{
                          fontWeight: 800,
                          color: tx.transaction_type === 'Income' ? 'success.main' : 'error.main',
                        }}
                      >
                        {tx.transaction_type === 'Income' ? '+' : '-'} {formatCurrency(tx.amount)}
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          color="primary"
                          onClick={() => handleOpenEdit(tx)}
                          sx={{ mr: 1, bgcolor: 'rgba(99,102,241,0.05)', '&:hover': { bgcolor: 'rgba(99,102,241,0.15)' } }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          color="error"
                          onClick={() => handleOpenDelete(tx)}
                          sx={{ bgcolor: 'rgba(244,63,94,0.05)', '&:hover': { bgcolor: 'rgba(244,63,94,0.15)' } }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={transactions.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              sx={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
            />
          </>
        )}
      </TableContainer>

      {/* Add / Edit Transaction Modal */}
      <Dialog open={openAddEditDialog} onClose={handleCloseDialogs} fullWidth maxWidth="sm">
        <DialogTitle fontWeight={700}>
          {selectedTx ? 'Modify Transaction' : 'Record Transaction'}
        </DialogTitle>
        <DialogContent dividers sx={{ borderBottom: 'none' }}>
          {formErrors.api && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {formErrors.api}
            </Alert>
          )}
          <Grid container spacing={3.5} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Transaction Type"
                value={formType}
                onChange={(e) => setFormType(e.target.value)}
              >
                <MenuItem value="Expense">Expense</MenuItem>
                <MenuItem value="Income">Income</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Amount"
                type="number"
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
                error={!!formErrors.amount}
                helperText={formErrors.amount}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Autocomplete
                freeSolo
                options={CATEGORIES}
                value={formCategory}
                onChange={(event, newValue) => {
                  setFormCategory(newValue || '');
                }}
                onInputChange={(event, newInputValue) => {
                  setFormCategory(newInputValue);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    required
                    label="Category"
                    error={!!formErrors.category}
                    helperText={formErrors.category || 'Select category or type custom'}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                type="date"
                label="Date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                error={!!formErrors.date}
                helperText={formErrors.date}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={2}
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="e.g. Weekly grocery at DMart"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, justifyContent: 'flex-end', gap: 1.5 }}>
          <Button onClick={handleCloseDialogs} color="inherit" disabled={submitLoading} sx={{ py: 1, px: 2 }}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={submitLoading}
            sx={{ py: 1, px: 3 }}
          >
            {submitLoading ? <CircularProgress size={20} color="inherit" /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={openDeleteDialog} onClose={handleCloseDialogs}>
        <DialogTitle fontWeight={700}>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to permanently delete this transaction? This action is irreversible.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleCloseDialogs} color="inherit" disabled={submitLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
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

export default Transactions;
