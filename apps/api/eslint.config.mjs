import base from '@flow-review/eslint-config';

export default [...base, { ignores: ['dist/**', 'coverage/**', 'prisma/migrations/**'] }];
