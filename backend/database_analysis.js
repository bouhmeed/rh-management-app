// database_analysis.js - Comprehensive database analysis script
const mongoose = require('mongoose');
require('dotenv').config();

// Import all models
const Utilisateur = require('./models/Utilisateur');
const Role = require('./models/Role');
const Employe = require('./models/Employe');
const Departement = require('./models/Departement');
const Conge = require('./models/Conge');
const Contrat = require('./models/Contrat');
const Paie = require('./models/Paie');
const Presence = require('./models/Presence');

async function analyzeDatabase() {
    console.log('🔍 Starting comprehensive database analysis...\n');

    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        const collections = [
            { name: 'roles', model: Role },
            { name: 'utilisateurs', model: Utilisateur },
            { name: 'departements', model: Departement },
            { name: 'employes', model: Employe },
            { name: 'contrats', model: Contrat },
            { name: 'conges', model: Conge },
            { name: 'paies', model: Paie },
            { name: 'presences', model: Presence }
        ];

        const analysisResults = {};

        for (const collection of collections) {
            console.log(`📊 Analyzing ${collection.name}...`);
            const result = await analyzeCollection(collection.name, collection.model);
            analysisResults[collection.name] = result;
            console.log('✅ Done\n');
        }

        // Generate comprehensive report
        generateReport(analysisResults);

    } catch (error) {
        console.error('❌ Analysis failed:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');
    }
}

async function analyzeCollection(name, model) {
    const analysis = {
        name: name,
        count: 0,
        sampleDocuments: [],
        fieldAnalysis: {},
        relationships: [],
        dataQuality: {
            nullFields: [],
            emptyArrays: [],
            invalidData: []
        },
        indexes: [],
        testResults: []
    };

    try {
        // Get collection count
        analysis.count = await model.countDocuments();
        console.log(`   📈 Found ${analysis.count} documents`);

        // Get sample documents (max 3)
        const samples = await model.find().limit(3).lean();
        analysis.sampleDocuments = samples;

        if (samples.length > 0) {
            // Analyze fields
            const sample = samples[0];
            analysis.fieldAnalysis = analyzeFields(sample);

            // Test relationships
            analysis.relationships = await testRelationships(model, samples);

            // Test data quality
            analysis.dataQuality = await testDataQuality(model, samples);
        }

        // Test basic operations
        analysis.testResults = await testOperations(model);

        // Get index information
        analysis.indexes = await getIndexes(model);

    } catch (error) {
        console.error(`   ❌ Error analyzing ${name}:`, error.message);
        analysis.error = error.message;
    }

    return analysis;
}

function analyzeFields(sample) {
    const fields = {};
    
    for (const [key, value] of Object.entries(sample)) {
        fields[key] = {
            type: Array.isArray(value) ? 'Array' : typeof value,
            sample: Array.isArray(value) ? value.slice(0, 2) : value,
            required: false // Will be determined from schema
        };
    }

    return fields;
}

async function testRelationships(model, samples) {
    const relationships = [];
    const schema = model.schema;

    // Check for references in schema
    for (const [path, definition] of Object.entries(schema.paths)) {
        if (definition.instance === 'ObjectID' && definition.options && definition.options.ref) {
            relationships.push({
                field: path,
                ref: definition.options.ref,
                type: 'reference'
            });
        }
    }

    // Test population
    for (const relationship of relationships) {
        try {
            const populated = await model.find().populate(relationship.field).limit(1);
            if (populated.length > 0 && populated[0][relationship.field]) {
                relationship.working = true;
                relationship.sample = populated[0][relationship.field];
            } else {
                relationship.working = false;
            }
        } catch (error) {
            relationship.working = false;
            relationship.error = error.message;
        }
    }

    return relationships;
}

async function testDataQuality(model, samples) {
    const quality = {
        nullFields: [],
        emptyArrays: [],
        invalidData: []
    };

    for (const sample of samples) {
        for (const [key, value] of Object.entries(sample)) {
            if (value === null || value === undefined) {
                if (!quality.nullFields.includes(key)) {
                    quality.nullFields.push(key);
                }
            }
            
            if (Array.isArray(value) && value.length === 0) {
                if (!quality.emptyArrays.includes(key)) {
                    quality.emptyArrays.push(key);
                }
            }
        }
    }

    return quality;
}

async function testOperations(model) {
    const tests = [];

    // Test find operation
    try {
        const findAll = await model.find().limit(1);
        tests.push({
            operation: 'find',
            status: 'success',
            message: `Found ${findAll.length} documents`
        });
    } catch (error) {
        tests.push({
            operation: 'find',
            status: 'error',
            message: error.message
        });
    }

    // Test populate if there are references
    const schema = model.schema;
    let hasReferences = false;
    for (const [path, definition] of Object.entries(schema.paths)) {
        if (definition.instance === 'ObjectID' && definition.options && definition.options.ref) {
            hasReferences = true;
            break;
        }
    }

    if (hasReferences) {
        try {
            const populated = await model.find().limit(1).populate();
            tests.push({
                operation: 'populate',
                status: 'success',
                message: `Population working for ${populated.length} documents`
            });
        } catch (error) {
            tests.push({
                operation: 'populate',
                status: 'error',
                message: error.message
            });
        }
    }

    return tests;
}

async function getIndexes(model) {
    try {
        const indexes = await model.collection.getIndexes();
        return Object.keys(indexes).map(index => ({
            name: index,
            fields: indexes[index]
        }));
    } catch (error) {
        return [{ error: error.message }];
    }
}

function generateReport(analysisResults) {
    console.log('\n' + '='.repeat(80));
    console.log('📋 COMPREHENSIVE DATABASE ANALYSIS REPORT');
    console.log('='.repeat(80));

    let markdown = `# Database Documentation - HR Management System

*Generated on: ${new Date().toISOString()}*

## Overview

This document provides a comprehensive analysis of all collections in the HR Management System database.

`;

    for (const [collectionName, analysis] of Object.entries(analysisResults)) {
        markdown += generateCollectionReport(collectionName, analysis);
    }

    // Write to file
    const fs = require('fs');
    fs.writeFileSync('../database_documentation.md', markdown);
    console.log('\n📄 Report saved to database_documentation.md');
}

function generateCollectionReport(name, analysis) {
    let report = `## Collection: ${name}

`;

    if (analysis.error) {
        report += `❌ **Error:** ${analysis.error}

`;
        return report;
    }

    report += `**Document Count:** ${analysis.count}

`;

    if (analysis.sampleDocuments.length > 0) {
        report += `### Purpose
${getCollectionPurpose(name)}

### Fields & Types
`;

        const fields = analysis.fieldAnalysis;
        for (const [fieldName, fieldInfo] of Object.entries(fields)) {
            if (fieldName !== '_id' && fieldName !== '__v') {
                report += `- **${fieldName}**: ${fieldInfo.type}`;
                if (fieldInfo.sample !== null && fieldInfo.sample !== undefined) {
                    report += ` (sample: ${JSON.stringify(fieldInfo.sample)})`;
                }
                report += '\n';
            }
        }

        report += `
### Relationships
`;
        if (analysis.relationships.length > 0) {
            for (const rel of analysis.relationships) {
                report += `- **${rel.field}** → ${rel.ref} (${rel.working ? '✅ Working' : '❌ Not working'})\n`;
            }
        } else {
            report += '- No relationships found\n';
        }

        report += `
### Data Quality Notes
`;
        if (analysis.dataQuality.nullFields.length > 0) {
            report += `- Fields with null values: ${analysis.dataQuality.nullFields.join(', ')}\n`;
        }
        if (analysis.dataQuality.emptyArrays.length > 0) {
            report += `- Empty arrays: ${analysis.dataQuality.emptyArrays.join(', ')}\n`;
        }
        if (analysis.dataQuality.nullFields.length === 0 && analysis.dataQuality.emptyArrays.length === 0) {
            report += '- ✅ No major data quality issues detected\n';
        }

        report += `
### Indexes & Performance Notes
`;
        if (analysis.indexes.length > 0) {
            for (const index of analysis.indexes) {
                if (index.error) {
                    report += `- ❌ Error getting indexes: ${index.error}\n`;
                } else {
                    report += `- **${index.name}**: ${JSON.stringify(index.fields)}\n`;
                }
            }
        } else {
            report += '- Only default indexes found\n';
        }

        report += `
### Recommendations / Improvements
${getRecommendations(name, analysis)}

### Test Results
`;
        for (const test of analysis.testResults) {
            report += `- **${test.operation}**: ${test.status === 'success' ? '✅' : '❌'} ${test.message}\n`;
        }

        report += `
### Sample Document
\`\`\`json
${JSON.stringify(analysis.sampleDocuments[0], null, 2)}
\`\`\`

---
`;
    } else {
        report += `❌ **No documents found in this collection**

---
`;
    }

    return report;
}

function getCollectionPurpose(name) {
    const purposes = {
        'roles': 'Store user roles and permissions for access control',
        'utilisateurs': 'Store user authentication and account information',
        'departements': 'Store department information and employee assignments',
        'employes': 'Store employee profile and professional information',
        'contrats': 'Store employment contracts and terms',
        'conges': 'Store leave requests and approvals',
        'paies': 'Store payroll and salary information',
        'presences': 'Store employee attendance and time tracking data'
    };
    return purposes[name] || 'Collection purpose not defined';
}

function getRecommendations(name, analysis) {
    const recommendations = [];

    // Common recommendations
    if (analysis.count === 0) {
        recommendations.push('- Consider adding sample data for testing');
    }

    if (analysis.indexes.length <= 1) {
        recommendations.push('- Consider adding indexes for frequently queried fields');
    }

    // Specific recommendations based on collection
    switch (name) {
        case 'utilisateurs':
            recommendations.push('- Ensure password hashing is properly implemented');
            recommendations.push('- Consider implementing account lockout after failed attempts');
            break;
        case 'employes':
            recommendations.push('- Add unique constraint on matricule field');
            recommendations.push('- Consider adding index on department for faster queries');
            break;
        case 'paies':
            recommendations.push('- Ensure compound unique index on (employe, mois) exists');
            recommendations.push('- Consider adding validation for salary calculations');
            break;
        case 'presences':
            recommendations.push('- Ensure compound unique index on (employe, date) exists');
            recommendations.push('- Consider adding indexes for date range queries');
            break;
    }

    if (recommendations.length === 0) {
        recommendations.push('- Collection structure looks good');
    }

    return recommendations.join('\n');
}

// Run the analysis
analyzeDatabase();
