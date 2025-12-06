import zohoClient from '../config/zoho.js';
import prisma from '../config/prismaClient.js';

class ZohoService {
  async createLeadFromUser(user, courseId) {
    try {
      const course = await prisma.course.findUnique({
        where: { id: courseId },
      });

      if (!course) {
        throw new Error('Course not found');
      }

      const leadData = {
        Last_Name: user.name,
        Email: user.email,
        Lead_Source: 'Mobile App',
        Lead_Status: 'Interested',
        Description: `Interested in: ${course.title}`,
        Course_Interest: course.title,
        Course_Category: course.category,
        Course_Price: course.price,
      };

      const result = await zohoClient.createLead(leadData);

      return result;
    } catch (error) {
      console.error('Zoho lead creation error:', error);
      throw error;
    }
  }

  async updateLeadOnPurchase(zohoLeadId, purchaseData) {
    try {
      const updates = {
        Lead_Status: 'Converted',
        Purchase_Amount: purchaseData.amount,
        Purchase_Date: new Date().toISOString(),
        Payment_Status: 'Paid',
      };

      const result = await zohoClient.updateLead(zohoLeadId, updates);

      // Optionally convert lead to contact/deal
      await zohoClient.convertLeadToStudent(zohoLeadId, purchaseData.courseId);

      return result;
    } catch (error) {
      console.error('Zoho lead update error:', error);
      throw error;
    }
  }

  async syncEnrollmentData(userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          enrollments: {
            include: {
              course: true,
            },
          },
          purchases: {
            where: { status: 'COMPLETED' },
          },
        },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Get or create lead in Zoho
      const leadData = {
        Last_Name: user.name,
        Email: user.email,
        Lead_Source: 'Mobile App',
        Total_Courses: user.enrollments.length,
        Total_Revenue: user.purchases.reduce((sum, p) => sum + p.amount, 0),
        Courses_Enrolled: user.enrollments.map(e => e.course.title).join(', '),
      };

      const result = await zohoClient.createLead(leadData);

      return result;
    } catch (error) {
      console.error('Zoho sync error:', error);
      throw error;
    }
  }
}

export default new ZohoService();

