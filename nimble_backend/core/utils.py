import hmac
import hashlib
import base64

def generate_esewa_signature(total_amount, transaction_uuid, product_code, secret_key):
    # eSewa v2 specific format
    data = f"total_amount={total_amount},transaction_uuid={transaction_uuid},product_code={product_code}"
    signature = hmac.new(
        bytes(secret_key, 'latin-1'),
        msg=bytes(data, 'latin-1'),
        digestmod=hashlib.sha256
    ).digest()
    return base64.b64encode(signature).decode("utf-8")