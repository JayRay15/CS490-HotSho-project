import { connectDB } from '../../../src/utils/db.js';
import { User } from '../User.js';
import mongoose from 'mongoose';

describe('User model extra validations and hooks', () => {
  beforeAll(async () => {
    // Ensure DB connected for save() hooks to run
    await connectDB();
  });

  afterAll(async () => {
    // Clean up users created by these tests
    await User.deleteMany({ email: /-test-extra@/ });
    await mongoose.disconnect();
  });

  test('phone validator accepts valid and rejects invalid', async () => {
    const u1 = new User({
      auth0Id: `u1-test-extra`,
      email: `valid-test-extra@${Date.now()}.com`,
      name: 'T1',
      phone: '123-456-7890',
    });
    await expect(u1.validate()).resolves.toBeUndefined();

    const u2 = new User({
      auth0Id: `u2-test-extra`,
      email: `invalid-test-extra@${Date.now()}.com`,
      name: 'T2',
      phone: 'not-a-phone',
    });
    await expect(u2.validate()).rejects.toThrow();
  });

  test('education GPA validator enforces 0..4.0 range', async () => {
    const u = new User({
      auth0Id: `gpa-test-extra`,
      email: `gpa-test-extra@${Date.now()}.com`,
      name: 'GPA',
      education: [
        { institution: 'X', degree: 'BSc', fieldOfStudy: 'CS', startDate: new Date('2015-01-01'), gpa: 4.5 },
      ],
    });
    await expect(u.validate()).rejects.toThrow();
  });

  test('project githubUrl and projectUrl url validators', async () => {
    const uGood = new User({
      auth0Id: `proj-good-test-extra`,
      email: `proj-good-test-extra@${Date.now()}.com`,
      name: 'ProjGood',
      projects: [
        { name: 'P', description: 'D', technologies: ['js'], startDate: new Date(), projectUrl: 'https://example.com', githubUrl: 'https://github.com/user/repo' }
      ]
    });
    await expect(uGood.validate()).resolves.toBeUndefined();

    const uBad = new User({
      auth0Id: `proj-bad-test-extra`,
      email: `proj-bad-test-extra@${Date.now()}.com`,
      name: 'ProjBad',
      projects: [
        { name: 'P', description: 'D', technologies: ['js'], startDate: new Date(), projectUrl: '://bad-url', githubUrl: 'not-a-github' }
      ]
    });
    await expect(uBad.validate()).rejects.toThrow();
  });

  test('certification dateEarned and expiration rules', async () => {
    const future = new Date(Date.now() + 1000 * 60 * 60 * 24);
    const uFuture = new User({
      auth0Id: `cert-future-test-extra`,
      email: `cert-future-test-extra@${Date.now()}.com`,
      name: 'CertFuture',
      certifications: [
        { name: 'C', organization: 'O', dateEarned: future }
      ]
    });
    await expect(uFuture.validate()).rejects.toThrow();

    const uDoesNotExpire = new User({
      auth0Id: `cert-expire-test-extra`,
      email: `cert-expire-test-extra@${Date.now()}.com`,
      name: 'CertNoExp',
      certifications: [
        { name: 'C', organization: 'O', dateEarned: new Date('2020-01-01'), doesNotExpire: true, expirationDate: new Date('2025-01-01') }
      ]
    });
    await expect(uDoesNotExpire.validate()).rejects.toThrow();
  });

  test('picture accepts data URL images and rejects invalid', async () => {
    const dataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA';
    const uGood = new User({
      auth0Id: `pic-good-test-extra`,
      email: `pic-good-test-extra@${Date.now()}.com`,
      name: 'PicGood',
      picture: dataUrl
    });
    await expect(uGood.validate()).resolves.toBeUndefined();

    const uBad = new User({
      auth0Id: `pic-bad-test-extra`,
      email: `pic-bad-test-extra@${Date.now()}.com`,
      name: 'PicBad',
      picture: 'ftp://not-allowed'
    });
    await expect(uBad.validate()).rejects.toThrow();
  });

  test('employment pre-save migrates jobTitle to position and enforces required', async () => {
    // Migration: jobTitle -> position
    const u = new User({
      auth0Id: `emp-mig-test-extra`,
      email: `emp-mig-test-extra@${Date.now()}.com`,
      name: 'Emp',
      employment: [ { jobTitle: 'OldTitle', company: 'C', startDate: new Date('2020-01-01') } ]
    });
    await u.save();
    expect(u.employment[0].position).toBe('OldTitle');

    // Missing both position and jobTitle should error on save
    const uBad = new User({
      auth0Id: `emp-bad-test-extra`,
      email: `emp-bad-test-extra@${Date.now()}.com`,
      name: 'EmpBad',
      employment: [ { company: 'C', startDate: new Date('2020-01-01') } ]
    });
    await expect(uBad.save()).rejects.toThrow();
  });

  test('password pre-save hashes and comparePassword works', async () => {
    const plain = 'Aa1strong!';
    const u = new User({
      auth0Id: `pw-test-extra`,
      email: `pw-test-extra@${Date.now()}.com`,
      name: 'PW',
      password: plain
    });
    await u.save();
    expect(u.password).not.toBe(plain);
    const ok = await u.comparePassword(plain);
    expect(ok).toBe(true);
    const bad = await u.comparePassword('wrong');
    expect(bad).toBe(false);
  });
});
