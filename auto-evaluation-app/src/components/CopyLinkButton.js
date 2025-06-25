import React from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';

const CopyLinkButton = ({ formId }) => {
  const formUrl = `http://yourdomain.com/form/${formId}`;

  return (
    <div>
      <input value={formUrl} readOnly />
      <CopyToClipboard text={formUrl}>
        <button>Copier le lien</button>
      </CopyToClipboard>
    </div>
  );
};

export default CopyLinkButton;
