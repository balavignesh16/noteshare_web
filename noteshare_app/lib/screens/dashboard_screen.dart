import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';

// A reusable card widget for displaying courses
class CourseCard extends StatelessWidget {
  final String courseName;
  const CourseCard({Key? key, required this.courseName}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final courseCode = courseName.split(' - ')[0];
    final title = courseName.split(' - ').length > 1 ? courseName.split(' - ')[1] : courseName;

    return Card(
      clipBehavior: Clip.antiAlias,
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: InkWell(
        onTap: () {
          // TODO: Navigate to CourseView screen
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Tapped on $title')),
          );
        },
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              height: 80,
              width: double.infinity,
              color: theme.colorScheme.primaryContainer,
              child: Icon(Icons.menu_book, size: 40, color: theme.colorScheme.onPrimaryContainer),
            ),
            Padding(
              padding: const EdgeInsets.all(12.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    courseCode,
                    style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.secondary),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}


class DashboardScreen extends StatefulWidget {
  const DashboardScreen({Key? key}) : super(key: key);

  @override
  _DashboardScreenState createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  Future<Map<String, List<String>>>? _coursesFuture;

  @override
  void initState() {
    super.initState();
    _coursesFuture = _fetchCourses();
  }

  Future<Map<String, List<String>>> _fetchCourses() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return {'myCourses': [], 'discoverCourses': []};

    // Get user's subscribed courses
    final userDoc = await FirebaseFirestore.instance.collection('users').doc(user.uid).get();
    final subscribedCourses = List<String>.from(userDoc.data()?['subscribedCourses'] ?? []);
    final subscribedSet = Set.from(subscribedCourses);

    // Get all available courses from notes
    final notesSnapshot = await FirebaseFirestore.instance.collection('notes').get();
    final allCoursesSet = <String>{};
    for (var doc in notesSnapshot.docs) {
      allCoursesSet.add(doc.data()['course']);
    }

    final myCourses = allCoursesSet.where((course) => subscribedSet.contains(course)).toList();
    final discoverCourses = allCoursesSet.where((course) => !subscribedSet.contains(course)).toList();
    
    myCourses.sort();
    discoverCourses.sort();

    return {
      'myCourses': myCourses,
      'discoverCourses': discoverCourses,
    };
  }


  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(
        title: const Text('Dashboard'),
        centerTitle: false,
        elevation: 0,
        backgroundColor: Colors.transparent,
      ),
      body: FutureBuilder<Map<String, List<String>>>(
        future: _coursesFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return Center(child: Text('Error: ${snapshot.error}'));
          }
          if (!snapshot.hasData) {
            return const Center(child: Text('No courses found.'));
          }

          final myCourses = snapshot.data!['myCourses']!;
          final discoverCourses = snapshot.data!['discoverCourses']!;

          return RefreshIndicator(
            onRefresh: () async {
              setState(() {
                _coursesFuture = _fetchCourses();
              });
            },
            child: ListView(
              padding: const EdgeInsets.all(16.0),
              children: [
                Text(
                  'My Courses',
                  style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 16),
                myCourses.isEmpty
                    ? const Text('No notes found for your subscribed courses.')
                    : GridView.builder(
                        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 2,
                          crossAxisSpacing: 16,
                          mainAxisSpacing: 16,
                          childAspectRatio: 0.8,
                        ),
                        itemCount: myCourses.length,
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemBuilder: (context, index) => CourseCard(courseName: myCourses[index]),
                      ),
                const SizedBox(height: 32),
                Text(
                  'Discover',
                  style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 16),
                discoverCourses.isEmpty
                    ? const Text('No other courses with notes available.')
                    : GridView.builder(
                        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 2,
                          crossAxisSpacing: 16,
                          mainAxisSpacing: 16,
                          childAspectRatio: 0.8,
                        ),
                        itemCount: discoverCourses.length,
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemBuilder: (context, index) => CourseCard(courseName: discoverCourses[index]),
                      ),
              ],
            ),
          );
        },
      ),
    );
  }
}