import React from "react";

// slurs aren't allowed -> create filter
// check message length before posting

const page = () => {
  return (
    <div className="p-16 mx-auto md:w-[50%] flex-col justify-between">
      <h1 className="text-4xl font-bold">Terms</h1>
      <p className="mt-8 text-2xl">
        Cheddarboxd, at its core, is a place for everyone to feel welcomed,
        understood, and supported. In saying this, we kindly ask that all dialog
        remains respectful. Harassement of any kind is not allowed. In the
        instance there are issues, we&apos;ll reach out but reserve the right to
        deactivate your acocunt.
      </p>
      <p></p>
    </div>
  );
};

export default page;
