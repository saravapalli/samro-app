import { Card, CardActions, CardContent, Chip, Divider, Stack, Typography } from '@mui/material';
import type { BusinessMatch } from '../../context/PlanningContext';

export function BusinessCard(props: {
  match: BusinessMatch;
  reasoning?: string;
  onSelect: () => void;
  onViewDetails?: () => void;
}) {
  const { match } = props;

  const statusColor =
    match.status === 'shortlisted'
      ? ('success' as const)
      : match.status === 'viewed'
        ? ('info' as const)
        : match.status === 'rejected'
          ? ('error' as const)
          : ('primary' as const);

  return (
    <Card
      variant="outlined"
      sx={{
        borderColor: 'divider',
        backgroundImage: 'linear-gradient(135deg, rgba(6,182,212,0.06), rgba(124,58,237,0.06))',
      }}
    >
      <CardContent>
        <Stack spacing={0.5}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="h6">{match.businessName}</Typography>
            <Chip label={`Match ${Math.round(match.matchScore * 100)}%`} size="small" color="secondary" />
          </Stack>

          <Typography variant="body2" color="text.secondary">
            Estimated price: ${match.estimatedPrice.toLocaleString()}
          </Typography>

          <Divider />

          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            {props.reasoning ?? match.reasoning}
          </Typography>

          <Stack direction="row" spacing={1}>
            <Chip
              label={match.status}
              color={statusColor as any}
              variant="outlined"
              size="small"
            />
          </Stack>
        </Stack>
      </CardContent>

      <CardActions>
        <Chip
          label="Select"
          component="button"
          onClick={props.onSelect}
          clickable
          sx={{
            cursor: 'pointer',
            fontWeight: 800,
          }}
        />
        {props.onViewDetails ? (
          <Chip
            label="View Details"
            component="button"
            onClick={props.onViewDetails}
            clickable
            sx={{
              cursor: 'pointer',
              fontWeight: 800,
            }}
          />
        ) : null}
      </CardActions>
    </Card>
  );
}

