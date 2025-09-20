import type { DialogProps } from '@mui/material/Dialog';

import { z as zod } from 'zod';
import { useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { Form, Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

export type ProductReviewCreateSchemaType = zod.infer<typeof ProductReviewCreateSchema>;

export const ProductReviewCreateSchema = zod.object({
  rating: zod.number().min(1, 'Rating must be greater than or equal to 1!'),
  name: zod.string().min(1, { message: 'Name is required!' }),
  review: zod.string().min(1, { message: 'Review is required!' }),
  email: zod
    .string()
    .min(1, { message: 'Email is required!' })
    .email({ message: 'Email must be a valid email address!' }),
});

// ----------------------------------------------------------------------

type Props = DialogProps & {
  onClose: () => void;
};

export function ProductReviewCreateForm({ onClose, sx, ...other }: Props) {
  const defaultValues: ProductReviewCreateSchemaType = {
    rating: 0,
    review: '',
    name: '',
    email: '',
  };

  const methods = useForm<ProductReviewCreateSchemaType>({
    mode: 'all',
    resolver: zodResolver(ProductReviewCreateSchema),
    defaultValues,
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      reset();
      onClose();
      console.info('DATA', data);
    } catch (error) {
      console.error(error);
    }
  });

  const onCancel = useCallback(() => {
    onClose();
    reset();
  }, [onClose, reset]);

  return (
    <Dialog onClose={onClose} sx={sx} {...other}>
      <Form methods={methods} onSubmit={onSubmit}>
        <DialogTitle>Add review</DialogTitle>

        <DialogContent>
          <div>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Your review about this product:
            </Typography>
            <Field.Rating name="rating" />
          </div>

          <Field.Text name="review" label="Review *" multiline rows={3} sx={{ mt: 3 }} />
          <Field.Text name="name" label="Name *" sx={{ mt: 3 }} />
          <Field.Text name="email" label="Email *" sx={{ mt: 3 }} />
        </DialogContent>

        <DialogActions>
          <Button color="inherit" variant="outlined" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" loading={isSubmitting}>
            Post
          </Button>
        </DialogActions>
      </Form>
    </Dialog>
  );
}
