require('dotenv/config');
const bcrypt = require('bcryptjs');
const prisma = require('../src/config/prisma');

async function main() {
  console.log('🌱 Seeding database...');

  // ---------- SPECIES ----------
  const species = [
    { name: 'Dog',   nameSi: 'සුනඛයා',  nameTa: 'நாய்' },
    { name: 'Cat',   nameSi: 'බළලා',    nameTa: 'பூனை' },
    { name: 'Other', nameSi: 'අනෙකුත්', nameTa: 'மற்றவை' },
  ];

  for (const s of species) {
    await prisma.species.upsert({
      where: { name: s.name },
      update: { nameSi: s.nameSi, nameTa: s.nameTa },
      create: s,
    });
    console.log(`  ✓ Species: ${s.name}`);
  }

  // ---------- ADMIN USER ----------
  const adminExists = await prisma.user.findUnique({
    where: { username: 'admin' },
  });

  if (!adminExists) {
    const passwordHash = await bcrypt.hash('admin123', 10);
    await prisma.user.create({
      data: {
        username: 'admin',
        passwordHash,
        fullName: 'System Administrator',
        role: 'SUPER_ADMIN',
        preferredLang: 'en',
      },
    });
    console.log('  ✓ Admin user created (username: admin, password: admin123)');
  } else {
    console.log('  ℹ Admin user already exists');
  }

  // ---------- VET PROFILES ----------
  const testVets = [
    {
      fullName: 'Dr. Nimal Perera',
      slvcRegNo: 'SLVC-2019-00142',
      employmentType: 'GOV',
      workplace: 'Divisional Veterinary Office, Kandy',
      district: 'Kandy',
      phone: '0812233445',
      email: 'nimal.perera@daph.gov.lk',
      status: 'ACTIVE',
    },
    {
      fullName: 'Dr. Ayesha Fernando',
      slvcRegNo: 'SLVC-2018-00087',
      employmentType: 'PRIVATE',
      workplace: 'Colombo Pet Clinic',
      district: 'Colombo',
      phone: '0112345678',
      email: 'ayesha@colombopetclinic.lk',
      status: 'ACTIVE',
    },
    {
      fullName: 'Dr. Ravi Jayawardena',
      slvcRegNo: 'SLVC-2020-00211',
      employmentType: 'NGO',
      workplace: 'Kandy Animal Welfare Trust',
      district: 'Kandy',
      phone: '0771234567',
      email: 'ravi@kawt.lk',
      status: 'ACTIVE',
    },
  ];

  for (const v of testVets) {
    const existing = await prisma.vet.findUnique({
      where: { slvcRegNo: v.slvcRegNo },
    });
    if (!existing) {
      await prisma.vet.create({ data: v });
      console.log(`  ✓ Vet: ${v.fullName} (${v.slvcRegNo})`);
    } else {
      console.log(`  ℹ Vet already exists: ${v.fullName}`);
    }
  }

  // ---------- ORIGINAL TEST OWNERS ----------
  const testOwners = [
    {
      fullName: 'Dr. Anura Bandara',
      nic: '196012345678',
      phone: '0771234567',
      email: 'anura@example.lk',
      address: '12 Temple Road, Kandy',
      preferredLang: 'si',
      ownerType: 'PERSON',
      district: 'Kandy',
    },
    {
      fullName: 'Mrs. Sita Fernando',
      nic: '197534567890',
      phone: '0712345678',
      email: 'sita@example.lk',
      address: '88 Marine Drive, Colombo 04',
      preferredLang: 'en',
      ownerType: 'PERSON',
      district: 'Colombo',
    },
    {
      fullName: 'Mr. Ravi Kumar',
      nic: '198845678901',
      phone: '0765432109',
      email: 'ravi@example.lk',
      address: '5 Jaffna Road, Vavuniya',
      preferredLang: 'ta',
      ownerType: 'PERSON',
      district: 'Vavuniya',
    },
    {
      fullName: 'Kandy Municipal Council - Animal Welfare',
      phone: '0812345678',
      email: 'animalwelfare@kmc.lk',
      address: 'Municipal Office, Kandy',
      preferredLang: 'si',
      ownerType: 'ORGANIZATION',
      registrationNumber: 'KMC-AW-2024-01',
      contactPerson: 'Mr. Sunil Rathnayake',
      district: 'Kandy',
    },
  ];

  const ownerIds = [];
  for (const o of testOwners) {
    const existing = await prisma.owner.findFirst({
      where: { fullName: o.fullName },
    });
    const owner = existing
      ? await prisma.owner.update({ where: { id: existing.id }, data: o })
      : await prisma.owner.create({ data: o });
    ownerIds.push(owner.id);
    console.log(`  ✓ Owner: ${o.fullName} (id ${owner.id})`);
  }

  // ---------- ORIGINAL TEST ANIMALS ----------
  const dogSpecies = await prisma.species.findUnique({ where: { name: 'Dog' } });
  const catSpecies = await prisma.species.findUnique({ where: { name: 'Cat' } });

  const testAnimals = [
    {
      clientUuid: 'seed-dog-001',
      name: 'Rex',
      speciesId: dogSpecies.id,
      breed: 'German Shepherd',
      dob: new Date('2022-03-15'),
      sex: 'MALE',
      color: 'Brown',
      currentOwnerId: ownerIds[0],
      status: 'ACTIVE',
      chipRequirement: 'REQUIRED',
    },
    {
      clientUuid: 'seed-dog-002',
      name: 'Luna',
      speciesId: dogSpecies.id,
      breed: 'Labrador',
      dob: new Date('2021-08-20'),
      sex: 'FEMALE',
      color: 'Golden',
      currentOwnerId: ownerIds[1],
      status: 'ACTIVE',
      chipRequirement: 'REQUIRED',
    },
    {
      clientUuid: 'seed-cat-001',
      name: 'Snowy',
      speciesId: catSpecies.id,
      breed: 'Persian',
      dob: new Date('2023-01-10'),
      sex: 'FEMALE',
      color: 'White',
      currentOwnerId: ownerIds[1],
      status: 'ACTIVE',
      chipRequirement: 'REQUIRED',
    },
    {
      clientUuid: 'seed-dog-003',
      name: 'Brownie',
      speciesId: dogSpecies.id,
      breed: 'Local Mix',
      dob: new Date('2020-11-05'),
      sex: 'MALE',
      color: 'Black',
      currentOwnerId: ownerIds[2],
      status: 'ACTIVE',
      chipRequirement: 'PROVISIONAL',
    },
  ];

  for (const a of testAnimals) {
    await prisma.animal.upsert({
      where: { clientUuid: a.clientUuid },
      update: { name: a.name },
      create: a,
    });
    console.log(`  ✓ Animal: ${a.name} (${a.clientUuid})`);
  }

  // ---------- DEMO OWNERS (rich data for presentation) ----------
  const demoOwners = [
    {
      fullName: 'Sunethra Weerasinghe',
      nic: '198512345670',
      phone: '0771112233',
      address: '22 Flower Road, Colombo 07',
      district: 'Colombo',
      preferredLang: 'en',
      ownerType: 'PERSON',
    },
    {
      fullName: 'Mohammed Rizwan',
      nic: '199045678901',
      phone: '0765551234',
      address: '55 Hospital Road, Jaffna',
      district: 'Jaffna',
      preferredLang: 'ta',
      ownerType: 'PERSON',
    },
    {
      fullName: 'Chaminda Perera',
      nic: '197890123456',
      phone: '0719988776',
      address: '8 Main Street, Galle',
      district: 'Galle',
      preferredLang: 'si',
      ownerType: 'PERSON',
    },
  ];

  const demoOwnerIds = [];
  for (const o of demoOwners) {
    const existing = await prisma.owner.findFirst({
      where: { fullName: o.fullName },
    });
    const created = existing
      ? await prisma.owner.update({ where: { id: existing.id }, data: o })
      : await prisma.owner.create({ data: o });
    demoOwnerIds.push(created.id);
    console.log(`  ✓ Demo owner: ${o.fullName} (${o.district})`);
  }

  // ---------- DEMO ANIMALS ----------
  const demoAnimals = [
    {
      clientUuid: 'demo-dog-001',
      name: 'Tommy',
      speciesId: dogSpecies.id,
      breed: 'Labrador',
      sex: 'MALE',
      color: 'Golden',
      currentOwnerId: demoOwnerIds[0],
      chipRequirement: 'REQUIRED',
      status: 'ACTIVE',
    },
    {
      clientUuid: 'demo-dog-002',
      name: 'Kalu',
      speciesId: dogSpecies.id,
      breed: 'Local Mix',
      sex: 'MALE',
      color: 'Black',
      currentOwnerId: demoOwnerIds[1],
      chipRequirement: 'PROVISIONAL',
      status: 'ACTIVE',
    },
    {
      clientUuid: 'demo-cat-001',
      name: 'Fluffy',
      speciesId: catSpecies.id,
      breed: 'Persian',
      sex: 'FEMALE',
      color: 'White',
      currentOwnerId: demoOwnerIds[2],
      chipRequirement: 'REQUIRED',
      status: 'ACTIVE',
    },
  ];

  for (const a of demoAnimals) {
    const existing = await prisma.animal.findUnique({
      where: { clientUuid: a.clientUuid },
    });
    if (!existing) {
      await prisma.animal.create({ data: a });
      console.log(`  ✓ Demo animal: ${a.name}`);
    } else {
      console.log(`  ℹ Demo animal exists: ${a.name}`);
    }
  }

  // ---------- DEMO CHIPS ----------
  const tommy = await prisma.animal.findUnique({
    where: { clientUuid: 'demo-dog-001' },
  });
  const fluffy = await prisma.animal.findUnique({
    where: { clientUuid: 'demo-cat-001' },
  });

  // Tommy: chipped
  if (tommy) {
    const existingChip = await prisma.microchip.findUnique({
      where: { chipNumber: '985141000000001' },
    });
    if (!existingChip && !tommy.microchip) {
      await prisma.microchip.create({
        data: {
          chipNumber: '985141000000001',
          animalId: tommy.id,
          implantLocation: 'Between shoulder blades',
          implantDate: new Date('2024-01-15'),
        },
      });
      console.log('  ✓ Chip attached to Tommy (985141000000001)');
    }
  }

  // Fluffy: chipped
  if (fluffy) {
    const existingChip = await prisma.microchip.findUnique({
      where: { chipNumber: '985141000000002' },
    });
    if (!existingChip && !fluffy.microchip) {
      await prisma.microchip.create({
        data: {
          chipNumber: '985141000000002',
          animalId: fluffy.id,
          implantLocation: 'Between shoulder blades',
          implantDate: new Date('2024-03-20'),
        },
      });
      console.log('  ✓ Chip attached to Fluffy (985141000000002)');
    }
  }

  // Kalu: NO chip — for demo (shows the "missing required chip" alert)

  // ---------- DEMO VACCINATIONS ----------

  // Tommy: up-to-date rabies vaccination
  if (tommy) {
    const existingVac = await prisma.vaccination.findUnique({
      where: { clientUuid: 'demo-vac-tommy' },
    });
    if (!existingVac) {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      const nextDue = new Date(threeMonthsAgo);
      nextDue.setFullYear(nextDue.getFullYear() + 1);

      await prisma.vaccination.create({
        data: {
          clientUuid: 'demo-vac-tommy',
          animalId: tommy.id,
          vaccineType: 'RABIES',
          batchNo: 'RB-DEMO-001',
          manufacturer: 'Intervet',
          administeredDate: threeMonthsAgo,
          nextDueDate: nextDue,
        },
      });
      console.log('  ✓ Up-to-date vaccine: Tommy');
    }
  }

  // Kalu: OVERDUE rabies vaccination (for the red badge demo)
  const kalu = await prisma.animal.findUnique({
    where: { clientUuid: 'demo-dog-002' },
  });
  if (kalu) {
    const existingVac = await prisma.vaccination.findUnique({
      where: { clientUuid: 'demo-vac-kalu' },
    });
    if (!existingVac) {
      const twoYearsAgo = new Date();
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
      const nextDue = new Date(twoYearsAgo);
      nextDue.setFullYear(nextDue.getFullYear() + 1); // 1 year past due

      await prisma.vaccination.create({
        data: {
          clientUuid: 'demo-vac-kalu',
          animalId: kalu.id,
          vaccineType: 'RABIES',
          batchNo: 'RB-2023-OLD',
          manufacturer: 'Zoetis',
          administeredDate: twoYearsAgo,
          nextDueDate: nextDue,
        },
      });
      console.log('  ✓ Overdue vaccine: Kalu (for demo)');
    }
  }

  // Fluffy: due-soon rabies vaccination
  if (fluffy) {
    const existingVac = await prisma.vaccination.findUnique({
      where: { clientUuid: 'demo-vac-fluffy' },
    });
    if (!existingVac) {
      const elevenMonthsAgo = new Date();
      elevenMonthsAgo.setMonth(elevenMonthsAgo.getMonth() - 11);
      const nextDue = new Date(elevenMonthsAgo);
      nextDue.setFullYear(nextDue.getFullYear() + 1); // Due in ~1 month

      await prisma.vaccination.create({
        data: {
          clientUuid: 'demo-vac-fluffy',
          animalId: fluffy.id,
          vaccineType: 'RABIES',
          batchNo: 'RB-DEMO-002',
          manufacturer: 'Intervet',
          administeredDate: elevenMonthsAgo,
          nextDueDate: nextDue,
        },
      });
      console.log('  ✓ Due-soon vaccine: Fluffy');
    }
  }
  // ---------- LOCAL AUTHORITIES (stray dog custodians per Animal Welfare Act) ----------
  // Under the new Animal Welfare Act, genuine stray dogs with no caretaker
  // remain under the responsibility of local authorities for vaccination
  // and sterilisation.
  const authorities = [
    {
      fullName: 'Colombo Municipal Council - Animal Welfare Unit',
      ownerType: 'ORGANIZATION',
      registrationNumber: 'CMC-AW-2024',
      authorityCode: 'CMC',
      contactPerson: 'Chief Veterinary Officer',
      phone: '0112691111',
      email: 'aw@cmc.lk',
      address: 'Town Hall, Colombo 07',
      district: 'Colombo',
      preferredLang: 'si',
    },
    {
      fullName: 'Kandy Municipal Council - Animal Welfare Unit',
      ownerType: 'ORGANIZATION',
      registrationNumber: 'KMC-AW-2024',
      authorityCode: 'KMC',
      contactPerson: 'Chief Veterinary Officer',
      phone: '0812222222',
      email: 'aw@kandy.mc.gov.lk',
      address: 'Municipal Office, Kandy',
      district: 'Kandy',
      preferredLang: 'si',
    },
    {
      fullName: 'Galle Municipal Council - Animal Welfare Unit',
      ownerType: 'ORGANIZATION',
      registrationNumber: 'GMC-AW-2024',
      authorityCode: 'GMC',
      contactPerson: 'Chief Veterinary Officer',
      phone: '0912234567',
      email: 'aw@gallemc.lk',
      address: 'Municipal Office, Galle',
      district: 'Galle',
      preferredLang: 'si',
    },
    {
      fullName: 'Jaffna Municipal Council - Animal Welfare Unit',
      ownerType: 'ORGANIZATION',
      registrationNumber: 'JMC-AW-2024',
      authorityCode: 'JMC',
      contactPerson: 'Chief Veterinary Officer',
      phone: '0212222333',
      email: 'aw@jaffnamc.lk',
      address: 'Municipal Office, Jaffna',
      district: 'Jaffna',
      preferredLang: 'ta',
    },
    {
      fullName: 'Kandy Four Gravets Pradeshiya Sabha - Animal Welfare',
      ownerType: 'ORGANIZATION',
      registrationNumber: 'KFGPS-AW-2024',
      authorityCode: 'KFGPS',
      contactPerson: 'Secretary',
      phone: '0812345678',
      email: 'aw@kfgps.lk',
      address: 'Pradeshiya Sabha Office, Kandy',
      district: 'Kandy',
      preferredLang: 'si',
    },
  ];

  for (const a of authorities) {
    const existing = await prisma.owner.findFirst({
      where: { authorityCode: a.authorityCode },
    });
    if (!existing) {
      await prisma.owner.create({ data: a });
      console.log(`  ✓ Authority: ${a.fullName} (${a.authorityCode})`);
    } else {
      console.log(`  ℹ Authority exists: ${a.authorityCode}`);
    }
  }
  console.log('✅ Seeding complete!');
  console.log('🎬 Demo data ready!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });