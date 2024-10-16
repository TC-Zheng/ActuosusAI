// 'use client';
// import React, { useEffect, useState } from 'react';
// import {
//   useGetSearchResult,
//   usePostDownload,
// } from '@/app/models/download/hooks/customHooks';
// import { toast } from 'react-toastify';
// import { useDebounce } from '@/app/utils/utils';
// import {
//   Combobox,
//   ComboboxInput,
//   ComboboxOption,
//   ComboboxOptions,
// } from '@headlessui/react';
// import clsx from 'clsx';
// import CloseIcon from '@/app/public/icon/close.svg';
//
// export default function DownloadModelPage() {
//   const { postDownloadRequest, response, loading, error } = usePostDownload();
//   const { getSearchResult, searchResponse } = useGetSearchResult();
//   const debouncedSearch = useDebounce(getSearchResult, 300);
//   const [selectedModelName, setSelectedModelName] = useState('');
//   const [query, setQuery] = useState('');
//
//   const filteredPeople =
//     query === ''
//       ? people
//       : people.filter((person) => {
//           return person.name.toLowerCase().includes(query.toLowerCase());
//         });
//
//   const handleDownload = (e: React.FormEvent) => {
//     e.stopPropagation();
//     e.preventDefault();
//     void postDownloadRequest({ hf_model_id: query });
//   };
//   useEffect(() => {
//     if (response) {
//       toast(response.message);
//     }
//   }, [response]);
//   useEffect(() => {
//     if (error) {
//       toast.error(error);
//     }
//   }, [error]);
//   // Update search query when user types
//   useEffect(() => {
//     const trimmedInput = query.trim();
//     if (trimmedInput) {
//       debouncedSearch(trimmedInput);
//     }
//   }, [debouncedSearch, query]);
//   return (
//     <div className="mx-auto h-screen w-96 pt-20">
//       <Combobox
//         value={selectedModelName}
//         onChange={(value) => setSelectedModelName(value ?? '')}
//         onClose={() => setQuery('')}
//       >
//         <div className="flex flex-row">
//           <div className="relative w-64">
//             <ComboboxInput
//               className={clsx(
//                 'w-full rounded-lg border-none bg-white/5 py-1.5 pr-8 pl-3 text-sm/6 text-white',
//                 'focus:outline-none data-[focus]:outline-2 data-[focus]:-outline-offset-2 data-[focus]:outline-white/25'
//               )}
//               displayValue={(input: string) => input}
//               placeholder={'Search for a model'}
//               onChange={(event) => setQuery(event.target.value)}
//               spellCheck={false}
//             />
//             <button
//               className="absolute right-2 my-2"
//               onClick={(e) => {
//                 e.stopPropagation();
//                 setSelectedModelName('');
//               }}
//             >
//               <CloseIcon className="fill-primary-500" />
//             </button>
//           </div>
//           <button
//             onClick={() => alert(`Searching for: ${query}`)}
//             className="px-4 py-0.5 bg-background-400 text-white rounded-md"
//           >
//             Download
//           </button>
//         </div>
//
//         <ComboboxOptions
//           anchor="bottom"
//           transition
//           className={clsx(
//             'w-[var(--input-width)] rounded-xl border border-white/5 bg-white/5 p-1 [--anchor-gap:var(--spacing-1)] empty:invisible',
//             'transition duration-100 ease-in data-[leave]:data-[closed]:opacity-0'
//           )}
//         >
//           {searchResponse?.model_names.map((name) => (
//             <ComboboxOption
//               key={name}
//               value={name}
//               className="group flex cursor-default items-center gap-2 rounded-lg py-1.5 px-3 select-none data-[focus]:bg-white/10"
//             >
//               <div className="text-sm/6 text-white">{name}</div>
//             </ComboboxOption>
//           ))}
//         </ComboboxOptions>
//       </Combobox>
//     </div>
//   );
// }
