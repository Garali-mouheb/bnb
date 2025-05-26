const bcrypt = require('bcrypt');

const password = 'admin123'; // Remplacez 'votreMotDePasse' par le mot de passe souhaité
const saltRounds = 10;

bcrypt.hash(password, saltRounds, (err, hash) => {
  if (err) {
    console.error('Erreur lors du hachage :', err);
  } else {
    console.log('Mot de passe haché :', hash);
  }
});
