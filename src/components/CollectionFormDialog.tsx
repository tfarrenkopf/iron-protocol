import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Flame, Lock, Globe, Users, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useCollection, useCreateCollection, useUpdateCollection } from '@/hooks/useCollections';
import { toast } from '@/hooks/use-toast';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
} from '@/components/ui/drawer';

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
        toast({ title: 'Campaign updated', description: `${data.code_name} has been updated.` });
        onOpenChange(false);
      } else {
        const newCollection = await createCollection.mutateAsync(data);
        toast({ 
          title: 'Campaign created', 
          description: `${data.code_name} is ready. Now add missions to it!`,
        });
        onOpenChange(false);
        // Navigate to the new campaign to add missions
        if (newCollection?.id) {
          window.location.href = `/campaign/${newCollection.id}`;
        }
      }
    } catch (error: any) {
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to save campaign',
        variant: 'destructive',
      });
    }
  };

  const visibilityOptions = [
    { value: 'private', label: 'Private', icon: Lock, description: 'Only you' },
    { value: 'public', label: 'Public', icon: Globe, description: 'Everyone' },
    { value: 'shared', label: 'Shared', icon: Users, description: 'Friends' },
  ] as const;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-card border-t border-section-campaigns">
        <div className="mx-auto w-full max-w-md">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-section-campaigns" />
              <h2 className="font-display text-xl text-section-campaigns">
                {isEditing ? 'EDIT CAMPAIGN' : 'NEW CAMPAIGN'}
              </h2>
            </div>
            <DrawerClose asChild>
              <button className="p-2 hover:text-destructive transition-colors">
                <X className="w-5 h-5" />
              </button>
            </DrawerClose>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4">
            <div>
              <Label htmlFor="name" className="text-xs text-muted-foreground tracking-wider">CAMPAIGN NAME</Label>
              <Input
                id="name"
                {...register('name', { required: 'Name is required' })}
                placeholder="e.g., MORNING ASSAULT"
                className="bg-background border-border mt-1 font-display focus:border-section-campaigns"
              />
              {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
            </div>

            {/* Hidden code_name field - auto-generated from name */}
            <input type="hidden" {...register('code_name')} />

            <div>
              <Label htmlFor="description" className="text-xs text-muted-foreground tracking-wider">DESCRIPTION</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="What's this campaign about?"
                className="bg-background border-border mt-1 resize-none focus:border-section-campaigns"
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
                        ? 'bg-section-campaigns/10 border-section-campaigns text-section-campaigns'
                        : 'bg-background border-border hover:border-section-campaigns/50'
                    }`}
                  >
                    <option.icon className="w-4 h-4 mx-auto mb-1" />
                    <span className="text-xs font-display block">{option.label}</span>
                    <span className="text-[10px] text-muted-foreground block">{option.description}</span>
                  </button>
                ))}
              </div>
            </div>

            <DrawerFooter className="px-0">
              <div className="flex gap-2 w-full">
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
                  className="flex-1 bg-section-campaigns text-white hover:box-glow-campaigns"
                  disabled={createCollection.isPending || updateCollection.isPending}
                >
                  {createCollection.isPending || updateCollection.isPending ? 'Saving...' : isEditing ? 'Update' : 'Create'}
                </Button>
              </div>
            </DrawerFooter>
          </form>
        </div>
      </DrawerContent>
    </Drawer>
  );
}