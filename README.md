# Створення центру сертифікації

```bash
# 1. Створення структури директорій
mkdir -p ./ca/{certs,crl,private,newcerts}
touch ./ca/index.txt
echo "01" > ./ca/serial
# 2. Встановлення правильних прав доступу
chmod 700 ./ca/private
# 3. Створення приватного ключа CA
openssl genrsa -aes256 -out ./ca/private/ca.key 4096
chmod 400 ./ca/private/ca.key
# 4. Створення сертифіката CA
openssl req -new -x509 -days 3650 -key ./ca/private/ca.key \
-out ./ca/certs/ca.crt
# 5. Створення приватного ключа сервера
openssl genrsa -out ./ca/private/server.key 2048
# 6. Створення CSR для сервера
openssl req -new -key ./ca/private/server.key \
-out ./ca/server.csr
# 7. Підписання сертифіката сервера за допомогою CA
openssl x509 -req -days 365 -in ./ca/server.csr \
-CA ./ca/certs/ca.crt -CAkey ./ca/private/ca.key \
-CAcreateserial -out ./ca/certs/server.crt
```
