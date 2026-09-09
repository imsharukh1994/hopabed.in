"use client";

import { useEffect, useRef } from "react";

export interface PayUCheckoutData {
  payuUrl: string;
  key: string;
  txnid: string;
  amount: string;
  productinfo: string;
  firstname: string;
  email: string;
  phone: string;
  surl: string;
  furl: string;
  hash: string;
}

export function PayUCheckoutForm({ checkoutData }: { checkoutData: PayUCheckoutData }) {
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (formRef.current) {
      formRef.current.submit();
    }
  }, [checkoutData]);

  return (
    <form ref={formRef} action={checkoutData.payuUrl} method="POST" className="hidden">
      <input type="hidden" name="key" value={checkoutData.key} />
      <input type="hidden" name="txnid" value={checkoutData.txnid} />
      <input type="hidden" name="amount" value={checkoutData.amount} />
      <input type="hidden" name="productinfo" value={checkoutData.productinfo} />
      <input type="hidden" name="firstname" value={checkoutData.firstname} />
      <input type="hidden" name="email" value={checkoutData.email} />
      <input type="hidden" name="phone" value={checkoutData.phone} />
      <input type="hidden" name="surl" value={checkoutData.surl} />
      <input type="hidden" name="furl" value={checkoutData.furl} />
      <input type="hidden" name="hash" value={checkoutData.hash} />
    </form>
  );
}
