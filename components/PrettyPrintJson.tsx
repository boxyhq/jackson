const PrettyPrintJson = (props: any) => {
  const { data } = props;

  return (
    <div className='p-4 bg-gray-100 text-sm'>
      <pre>{JSON.stringify(data, null, 3)}</pre>
    </div>
  );
}

export default PrettyPrintJson;