import React from "react";

const page = () => {
  return (
    <div className="p-16 mx-auto md:w-[50%] flex-col justify-between">
      <h1 className="text-4xl font-bold">Privacy Policy</h1>
      <p className="mt-8 text-xl">
        Cheddarboxd stores uploaded images on a local server only to serve to
        users. Any uploaded data is only stored to be used for the website. No
        data is sold, or used for any other purpose.
      </p>
      <p className="mt-8 text-xl">
        By uploading reviews, you agree to have the ratings used for
        crowdsourced analytics. Should your review be made in private, only the
        score will be collected, all words will be kept private.
      </p>
    </div>
  );
};

export default page;
