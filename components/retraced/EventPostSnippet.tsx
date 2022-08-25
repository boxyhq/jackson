const EventPostSnippet = ({url}) => {
    return <div className="mockup-code m-10">
    <pre data-prefix=">">
      <code>Use the following URL to save events</code>
    </pre>
    <pre data-prefix=">" className="text-success">
      <code>POST {url}</code>
    </pre>
  </div>;
}

export default EventPostSnippet;