import {
  Description,
  Dialog,
  DialogPanel,
  DialogTitle,
} from '@headlessui/react';
import React from 'react';

export default function DeleteDialog(props: {
  open: boolean;
  onClose: () => void;
  onClick: () => void;
}) {
  return (
    <Dialog open={props.open} onClose={props.onClose} className="relative z-50">
      <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
        <DialogPanel className="max-w-lg space-y-4 border bg-background-700 p-12 text-accent-50">
          <DialogTitle className="font-bold">Delete Model</DialogTitle>
          <Description>This will permanently delete this model</Description>
          <p>
            Are you sure you want to delete the model? This action cannot be
            undone.
          </p>
          <div className="flex gap-4">
            <button onClick={props.onClose}>Cancel</button>
            <button className="text-error-600" onClick={props.onClick}>
              Delete all local files
            </button>
            {/*<button className="text-accent-300" onClick={props.onClick}>Only remove from the app</button>*/}
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
