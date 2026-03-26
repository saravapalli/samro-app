import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from '@mui/material';
import type { BusinessMatch } from '../../context/PlanningContext';

export function BusinessDetailDialog(props: {
  open: boolean;
  match?: BusinessMatch;
  onClose: () => void;
  onSelect: () => void;
  selectLoading?: boolean;
}) {
  const match = props.match;

  return (
    <Dialog open={props.open} onClose={props.onClose} fullWidth maxWidth="sm">
      <DialogTitle
        sx={{
          backgroundImage: 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(6,182,212,0.10))',
          borderRadius: 2,
        }}
      >
        {match ? match.businessName : 'Business details'}
      </DialogTitle>
      <DialogContent>
        {match ? (
          <Stack spacing={1.25} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Estimated price: ${match.estimatedPrice.toLocaleString()}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Match score: {Math.round(match.matchScore * 100)}%
            </Typography>
            <Typography variant="body1">{match.reasoning}</Typography>
          </Stack>
        ) : null}
      </DialogContent>
      <DialogActions>
        <Button onClick={props.onClose} color="inherit">
          Close
        </Button>
        <Button variant="contained" onClick={props.onSelect} disabled={!match || props.selectLoading}>
          {props.selectLoading ? 'Selecting...' : 'Select this business'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

