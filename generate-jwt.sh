#!/bin/bash

ENV_FILE=".env"
SECRET=$(openssl rand -hex 64)

# Si JWT_SECRET existe, on le remplace. Sinon, on l'ajoute.
if grep -q "^JWT_SECRET=" "$ENV_FILE"; then
  sed -i "s/^JWT_SECRET=.*/JWT_SECRET=$SECRET/" "$ENV_FILE"
else
  echo "" >> "$ENV_FILE"
  echo "JWT_SECRET=$SECRET" >> "$ENV_FILE"
fi

echo "✅ Nouveau JWT_SECRET généré et enregistré dans $ENV_FILE"