import { NextPage } from 'next';

const fields = [
  {
    id: 'tenant',
    label: 'Tenant',
    required: true,
    type: 'text',
    placeholder: 'acme.com',
  },
  {
    id: 'product',
    label: 'Product',
    required: true,
    type: 'text',
    placeholder: 'demo',
  },
  {
    id: 'redirectUrl',
    label: 'RedirectUrl',
    required: true,
    type: 'url',
    placeholder: 'http://localhost:3000',
  },
];

const NewIdP: NextPage = () => {
  const saveIdPConfig = (event) => {
    event.preventDefault();
  };

  return (
    <div className='bg-gradient-to-r bg-white border border-gray-200 code-preview dark:bg-gray-800 dark:border-gray-700 p-6 rounded-xl md:w-3/4 min-w-[28rem] md:max-w-lg'>
      <form onSubmit={saveIdPConfig}>
        {fields.map(({ id, placeholder, label, type, required }) => (
          <div className='mb-6 ' key={id}>
            <label htmlFor={id} className='block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300'>
              {label}
            </label>
            <input
              id={id}
              type={type}
              placeholder={placeholder}
              className='bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500'
              required={required}
            />
          </div>
        ))}

        <button
          type='submit'
          className='bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded leading-6 inline-block'>
          Submit
        </button>
      </form>
    </div>
  );
};

export default NewIdP;
