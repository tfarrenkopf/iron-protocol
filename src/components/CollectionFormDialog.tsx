import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Folder, Lock, Globe, Users } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useCollection, useCreateCollection, useUpdateCollection } from '@/hooks/useCollections';
import { toast } from '@/hooks/use-toast';

interface CollectionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collectionId?: string;
}

interface FormData {
  name: string;
  code_name: string;
  description: string;
  visibility: 'private' | 'public' | 'shared';
}

export function CollectionFormDialog({ open, onOpenChange, collectionId }: CollectionFormDialogProps) {
  const { data: existingCollection } = useCollection(collectionId);
  const createCollection = useCreateCollection();
  const updateCollection = useUpdateCollection();
  const isEditing = !!collectionId;

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      name: '',
      code_name: '',
      description: '',
      visibility: 'private',
    },
  });

  const visibility = watch('visibility');
  const name = watch('name');

  // Auto-generate code_name from name
  useEffect(() => {
    if (!isEditing && name) {
      const codeName = name.toUpperCase().replace(/[^A-Z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
      setValue('code_name', codeName);
    }
  }, [name, isEditing, setValue]);

  // Load existing collection data
  useEffect(() => {
    if (existingCollection && isEditing) {
      reset({
        name: existingCollection.name,
        code_name: existingCollection.code_name,
        description: existingCollection.description || '',
        visibility: existingCollection.visibility as 'private' | 'public' | 'shared',
      });
    } else if (!isEditing) {
      reset({
        name: '',
        code_name: '',
        description: '',
        visibility: 'private',
      });
    }
  }, [existingCollection, isEditing, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      if (isEditing && collectionId) {
        await updateCollection.mutateAsync({
          id: collectionId,
          ...data,
        });
        toast({ title: 'Collection updated', description: `${data.code_name} has been updated.` });
      } else {
        await createCollection.mutateAsync(data);
        toast({ title: 'Collection created', description: `${data.code_name} is ready to use.` });
      }
      onOpenChange(false);
    } catch (error: any) {
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to save collection',
        variant: 'destructive',
      });
    }
  };

  const visibilityOptions = [
    { value: 'private', label: 'Private', icon: Lock, description: 'Only you can see' },
    { value: 'public', label: 'Public', icon: Globe, description: 'Anyone can see' },
    { value: 'shared', label: 'Shared', icon: Users, description: 'Friends can see' },
  ] as const;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-primary flex items-center gap-2">
            <Folder className="w-5 h-5" />
            {isEditing ? 'EDIT COLLECTION' : 'NEW COLLECTION'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name" className="text-xs text-muted-foreground tracking-wider">NAME</Label>
            <Input
              id="name"
              {...register('name', { required: 'Name is required' })}
              placeholder="e.g., My Morning Routine"
              className="bg-background border-border mt-1"
            />
            {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <Label htmlFor="code_name" className="text-xs text-muted-foreground tracking-wider">CODE NAME</Label>
            <Input
              id="code_name"
              {...register('code_name', { required: 'Code name is required' })}
              placeholder="e.g., MORNING ROUTINE"
              className="bg-background border-border mt-1 font-display"
            />
            {errors.code_name && <p className="text-xs text-destructive mt-1">{errors.code_name.message}</p>}
          </div>

          <div>
            <Label htmlFor="description" className="text-xs text-muted-foreground tracking-wider">DESCRIPTION</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="What's this collection about?"
              className="bg-background border-border mt-1 resize-none"
              rows={2}
            />
          </div>

          <div>
            <Label className="text-xs text-muted-foreground tracking-wider">VISIBILITY</Label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {visibilityOptions.map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setValue('visibility', option.value)}
                  className={`p-3 rounded border text-center transition-colors ${
                    visibility === option.value
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'bg-background border-border hover:border-primary/50'
                  }`}
                >
                  <option.icon className="w-4 h-4 mx-auto mb-1" />
                  <span className="text-xs font-display block">{option.label}</span>
                  <span className="text-[10px] text-muted-foreground block">{option.description}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={createCollection.isPending || updateCollection.isPending}
            >
              {createCollection.isPending || updateCollection.isPending ? 'Saving...' : isEditing ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
