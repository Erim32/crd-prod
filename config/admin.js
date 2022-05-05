module.exports = ({ env }) => ({
  auth: {
    secret: env('ADMIN_JWT_SECRET', '80ed783511ba92331e7f4e153417843a'),
  },
});
