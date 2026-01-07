import db from '../lib/db.js';

class SearchService {
  async search(query, type = null) {
    console.log(`[Search Service] Searching for: "${query}", type: ${type || 'all'}`);
    
    const searchTerm = `%${query.toLowerCase()}%`;
    const results = [];

    // Search courses
    if (!type || type === 'all' || type === 'courses') {
      try {
        const courses = await db.course.findMany({
          where: {
            isActive: true,
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { description: { contains: query, mode: 'insensitive' } },
            ],
          },
          select: {
            id: true,
            name: true,
            description: true,
            instrument: true,
            pricePerSlot: true,
            previewVideoUrl: true,
            building: {
              select: {
                name: true,
              },
            },
          },
          take: 10,
        });

        courses.forEach((course) => {
          results.push({
            id: course.id,
            type: 'course',
            title: course.name,
            subtitle: course.instrument || 'Music Course',
            image: course.previewVideoUrl || null,
            extra: course.building?.name ? `at ${course.building.name}` : null,
          });
        });
      } catch (error) {
        console.error('[Search Service] Error searching courses:', error);
      }
    }

    // Search teachers
    if (!type || type === 'all' || type === 'teachers') {
      try {
        const teachers = await db.user.findMany({
          where: {
            role: 'TEACHER',
            isActive: true,
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { bio: { contains: query, mode: 'insensitive' } },
            ],
          },
          select: {
            id: true,
            name: true,
            bio: true,
            avatar: true,
            profilePicture: true,
            specializations: true,
          },
          take: 10,
        });

        teachers.forEach((teacher) => {
          results.push({
            id: teacher.id,
            type: 'teacher',
            title: teacher.name,
            subtitle: teacher.specializations?.length > 0 
              ? teacher.specializations.join(', ') 
              : 'Music Teacher',
            image: teacher.profilePicture || teacher.avatar || null,
            extra: teacher.bio ? teacher.bio.substring(0, 50) + '...' : null,
          });
        });
      } catch (error) {
        console.error('[Search Service] Error searching teachers:', error);
      }
    }

    // Search buildings
    if (!type || type === 'all' || type === 'buildings') {
      try {
        const buildings = await db.building.findMany({
          where: {
            isActive: true,
            approvalStatus: 'ACTIVE',
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { city: { contains: query, mode: 'insensitive' } },
              { address: { contains: query, mode: 'insensitive' } },
            ],
          },
          select: {
            id: true,
            name: true,
            city: true,
            address: true,
            visibilityType: true,
            _count: {
              select: {
                courses: true,
              },
            },
          },
          take: 10,
        });

        buildings.forEach((building) => {
          results.push({
            id: building.id,
            type: 'building',
            title: building.name,
            subtitle: `${building.city}`,
            image: null,
            extra: `${building._count.courses} courses available`,
          });
        });
      } catch (error) {
        console.error('[Search Service] Error searching buildings:', error);
      }
    }

    console.log(`[Search Service] Found ${results.length} results`);
    return results;
  }
}

export default new SearchService();
